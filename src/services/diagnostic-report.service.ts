import { SlackService } from './slack.service';
import { GeminiService } from './gemini.service';
import { SupabaseService } from './supabase.service';
import { TimeoutTracker } from '../utils/timeout-diagnostics';

export class DiagnosticReportService {
  private slackService: SlackService;
  private geminiService: GeminiService;
  private supabaseService: SupabaseService;
  private tracker: TimeoutTracker;

  constructor(
    slackService: SlackService,
    geminiService: GeminiService,
    supabaseService: SupabaseService
  ) {
    this.slackService = slackService;
    this.geminiService = geminiService;
    this.supabaseService = supabaseService;
    this.tracker = new TimeoutTracker();
  }

  async generateReportWithDiagnostics(
    channelId: string,
    dmUserIds: string[],
    reportType: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<void> {
    console.log('🔍 Starting report generation with diagnostics...');
    
    try {
      // 1. 시간 범위 계산
      this.tracker.startPhase('Calculate Time Range');
      const { since, until } = this.calculateTimeRange(reportType);
      this.tracker.endPhase();

      // 2. 채널 정보 확인
      this.tracker.startPhase('Verify Channel Access');
      const channelInfo = await this.verifyChannelAccess(channelId);
      this.tracker.endPhase();

      // 3. 메시지 수집 (병목 구간 예상)
      this.tracker.startPhase('Fetch Slack Messages', {
        channelId,
        channelName: channelInfo.name,
        timeRange: `${since.toISOString()} to ${until?.toISOString() || 'now'}`
      });
      
      const messages = await this.fetchMessagesWithDiagnostics(channelId, since, until);
      
      this.tracker.endPhase();
      this.tracker.addCheckpoint('Messages collected', {
        count: messages.length,
        hasThreads: messages.some(m => m.thread_ts)
      });

      // 메시지가 없는 경우 조기 종료
      if (messages.length === 0) {
        console.log('No messages found in the specified time range');
        await this.sendEmptyReport(dmUserIds, reportType, since, until);
        console.log(this.tracker.getReport());
        return;
      }

      // 4. AI 분석 (병목 구간 예상)
      this.tracker.startPhase('AI Analysis', {
        messageCount: messages.length,
        reportType
      });
      
      const analysis = await this.analyzeWithTimeout(messages, reportType);
      
      this.tracker.endPhase();
      this.tracker.addCheckpoint('AI analysis completed');

      // 5. 보고서 포맷팅
      this.tracker.startPhase('Format Report');
      const reportText = this.formatReport(analysis, reportType, messages.length);
      this.tracker.endPhase();

      // 6. 데이터베이스 저장
      this.tracker.startPhase('Save to Database');
      await this.saveReportWithRetry(reportType, channelId, analysis, dmUserIds.join(','));
      this.tracker.endPhase();

      // 7. DM 전송
      this.tracker.startPhase('Send DMs', {
        userCount: dmUserIds.length
      });
      
      await this.sendDMsWithDiagnostics(dmUserIds, reportText);
      
      this.tracker.endPhase();

      // 최종 리포트
      console.log(this.tracker.getReport());
      
    } catch (error) {
      this.tracker.captureError(error as Error, {
        channelId,
        dmUserIds,
        reportType
      });
      
      this.tracker.endPhase(error as Error);
      console.error('Report generation failed:', error);
      console.log(this.tracker.getReport());
      
      // 에러 진단 정보를 사용자에게 전송
      await this.sendErrorReport(dmUserIds, error as Error);
      
      throw error;
    }
  }

  private async fetchMessagesWithDiagnostics(
    channelId: string,
    since: Date,
    until?: Date
  ): Promise<any[]> {
    const messages: any[] = [];
    const startTime = Date.now();
    
    try {
      // 메인 메시지 가져오기
      this.tracker.addCheckpoint('Fetching main messages');
      const mainMessages = await this.slackService.getChannelMessages(channelId, since, until);
      messages.push(...mainMessages);
      
      this.tracker.addCheckpoint('Main messages fetched', {
        count: mainMessages.length,
        duration: Date.now() - startTime
      });

      // 스레드 메시지 처리
      const threadsToFetch = mainMessages.filter(m => m.thread_ts && m.reply_count > 0);
      
      if (threadsToFetch.length > 0) {
        this.tracker.addCheckpoint('Processing threads', {
          threadCount: threadsToFetch.length
        });

        // 병렬 처리로 성능 개선
        const BATCH_SIZE = 5;
        for (let i = 0; i < threadsToFetch.length; i += BATCH_SIZE) {
          const batch = threadsToFetch.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(msg => 
            this.fetchThreadWithTimeout(channelId, msg.thread_ts, since)
          );
          
          const batchResults = await Promise.allSettled(batchPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              messages.push(...result.value);
            } else {
              console.warn(`Thread fetch failed for ${batch[index].thread_ts}:`, result.reason);
            }
          });
          
          this.tracker.addCheckpoint(`Thread batch ${i / BATCH_SIZE + 1} completed`);
        }
      }

      return messages;
      
    } catch (error) {
      this.tracker.captureError(error as Error, {
        phase: 'fetchMessages',
        messagesCollected: messages.length
      });
      throw error;
    }
  }

  private async fetchThreadWithTimeout(
    channelId: string,
    threadTs: string,
    since: Date,
    timeoutMs: number = 5000
  ): Promise<any[]> {
    return Promise.race([
      this.slackService.getThreadMessages(channelId, threadTs, since),
      new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error(`Thread fetch timeout: ${threadTs}`)), timeoutMs)
      )
    ]);
  }

  private async analyzeWithTimeout(
    messages: any[],
    reportType: string,
    timeoutMs: number = 25000
  ): Promise<any> {
    return Promise.race([
      this.geminiService.analyzeMessages(messages, reportType as any),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('AI analysis timeout')), timeoutMs)
      )
    ]);
  }

  private async sendDMsWithDiagnostics(
    userIds: string[],
    reportText: string
  ): Promise<void> {
    const results = await Promise.allSettled(
      userIds.map((userId, index) => 
        this.sendDMWithRetry(userId, reportText, index)
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`Failed to send ${failures.length} DMs:`, failures);
    }
  }

  private async sendDMWithRetry(
    userId: string,
    text: string,
    index: number,
    maxRetries: number = 2
  ): Promise<void> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.tracker.addCheckpoint(`Sending DM ${index + 1}`, { userId, attempt });
        await this.slackService.sendDirectMessage(userId, text);
        return;
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  private async saveReportWithRetry(
    type: string,
    channelId: string,
    analysis: any,
    sentTo: string,
    maxRetries: number = 2
  ): Promise<void> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.supabaseService.saveReport({
          type: type as any,
          channel_id: channelId,
          analysis,
          sent_to: sentTo
        });
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Failed to save report after retries:', error);
          // 데이터베이스 저장 실패는 치명적이지 않으므로 계속 진행
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  private async verifyChannelAccess(channelId: string): Promise<any> {
    try {
      const result = await this.slackService.getChannelInfo(channelId);
      return result.channel;
    } catch (error: any) {
      if (error.data?.error === 'channel_not_found') {
        throw new Error(`Channel ${channelId} not found. Please check the channel ID.`);
      }
      if (error.data?.error === 'not_in_channel') {
        throw new Error(`Bot is not in channel ${channelId}. Please invite the bot first.`);
      }
      throw error;
    }
  }

  private calculateTimeRange(reportType: string): { since: Date; until?: Date } {
    const now = new Date();
    const since = new Date();

    switch (reportType) {
      case 'daily':
        since.setDate(since.getDate() - 1);
        break;
      case 'weekly':
        since.setDate(since.getDate() - 7);
        break;
      case 'monthly':
        since.setMonth(since.getMonth() - 1);
        break;
    }

    return { since, until: now };
  }

  private formatReport(analysis: any, reportType: string, messageCount: number): string {
    // 기존 formatReport 로직
    return `📊 ${reportType.toUpperCase()} REPORT\n\n${JSON.stringify(analysis, null, 2)}`;
  }

  private async sendEmptyReport(
    userIds: string[],
    reportType: string,
    since: Date,
    until?: Date
  ): Promise<void> {
    const text = `📊 ${reportType.toUpperCase()} REPORT\n\nNo messages found in the specified time range:\n${since.toISOString()} to ${until?.toISOString() || 'now'}`;
    
    for (const userId of userIds) {
      await this.slackService.sendDirectMessage(userId, text);
    }
  }

  private async sendErrorReport(userIds: string[], error: Error): Promise<void> {
    const errorReport = `⚠️ Report Generation Failed\n\nError: ${error.message}\n\nPlease check the logs for detailed diagnostics.`;
    
    for (const userId of userIds) {
      try {
        await this.slackService.sendDirectMessage(userId, errorReport);
      } catch (dmError) {
        console.error(`Failed to send error report to ${userId}:`, dmError);
      }
    }
  }
}