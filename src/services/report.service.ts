import { SlackService } from './slack.service';
import { SupabaseService } from './supabase.service';
import { GeminiService } from './gemini.service';
import { ChannelAnalysis, Report } from '../types';

export class ReportService {
  constructor(
    private slackService: SlackService,
    private supabaseService: SupabaseService,
    private geminiService: GeminiService
  ) {}

  async generateDailyReport(channelId: string, dmUserIds: string[]): Promise<void> {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    console.log(`Found ${messages.length} messages in the last 24 hours`);
    
    const analysis = await this.geminiService.analyzeMessages(messages, 'daily');
    const reportText = this.formatDailyReport(analysis);
    console.log('Report text length:', reportText.length);

    // Send to all users
    console.log(`Sending daily report to ${dmUserIds.length} users...`);
    for (const userId of dmUserIds) {
      try {
        console.log(`Sending to user: ${userId}`);
        await this.slackService.sendDirectMessage(userId, reportText);
      } catch (error) {
        console.error(`Failed to send report to ${userId}:`, error);
      }
    }

    const report: Report = {
      type: 'daily',
      channelId,
      analysis,
      sentTo: dmUserIds.join(','),
      createdAt: new Date()
    };

    await this.supabaseService.saveReport(report);
  }

  async generateWeeklyReport(channelId: string, dmUserIds: string[]): Promise<void> {
    // 지난 7일간의 데이터 수집
    const since = new Date();
    since.setDate(since.getDate() - 7);
    since.setHours(0, 0, 0, 0);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    console.log(`Found ${messages.length} messages in the last 7 days`);
    
    const analysis = await this.geminiService.analyzeMessages(messages, 'weekly');
    const reportText = this.formatWeeklyReport(analysis);
    console.log('Weekly report text length:', reportText.length);

    // Send to all users
    console.log(`Sending weekly report to ${dmUserIds.length} users...`);
    for (const userId of dmUserIds) {
      try {
        console.log(`Sending to user: ${userId}`);
        await this.slackService.sendDirectMessage(userId, reportText);
      } catch (error) {
        console.error(`Failed to send weekly report to ${userId}:`, error);
      }
    }

    const report: Report = {
      type: 'weekly',
      channelId,
      analysis,
      sentTo: dmUserIds.join(','),
      createdAt: new Date()
    };

    await this.supabaseService.saveReport(report);
  }

  async generateMonthlyReport(channelId: string, dmUserIds: string[]): Promise<void> {
    // 지난 달의 첫날부터 마지막날까지의 데이터 수집
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    since.setHours(0, 0, 0, 0);
    
    const until = new Date(now.getFullYear(), now.getMonth(), 0);
    until.setHours(23, 59, 59, 999);
    
    console.log(`Monthly report period: ${since.toISOString()} ~ ${until.toISOString()}`);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    const analysis = await this.geminiService.analyzeMessages(messages, 'monthly');
    const reportText = this.formatMonthlyReport(analysis);

    // Send to all users
    for (const userId of dmUserIds) {
      await this.slackService.sendDirectMessage(userId, reportText);
    }

    const report: Report = {
      type: 'monthly',
      channelId,
      analysis,
      sentTo: dmUserIds.join(','),
      createdAt: new Date()
    };

    await this.supabaseService.saveReport(report);
  }


  private formatDailyReport(analysis: ChannelAnalysis): string {
    let report = `*일일 업무 보고*\n\n`;
    
    if (analysis.insights?.actionItems && analysis.insights.actionItems.length > 0) {
      analysis.insights.actionItems.forEach((item: any, index: number) => {
        if (typeof item === 'string') {
          // 이전 형식 호환성
          report += `• ${item}\n`;
        } else if (item.summary) {
          // 한 줄 요약 형식
          report += `• ${item.summary}\n`;
        } else {
          // summary가 없는 경우 기본 task 표시
          report += `• ${item.task}\n`;
        }
      });
    } else {
      report += `보고할 업무가 없습니다`;
    }

    return report;
  }

  private formatWeeklyReport(analysis: ChannelAnalysis): string {
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    let report = `*주간 업무 보고*\n`;
    report += `_대상 기간: ${lastWeek.getMonth() + 1}월 ${lastWeek.getDate()}일 ~ ${now.getMonth() + 1}월 ${now.getDate() - 1}일_\n\n`;
    
    if (analysis.insights?.actionItems && analysis.insights.actionItems.length > 0) {
      analysis.insights.actionItems.forEach((item: any, index: number) => {
        if (typeof item === 'string') {
          // 이전 형식 호환성
          report += `• ${item}\n`;
        } else if (item.summary) {
          // 한 줄 요약 형식
          report += `• ${item.summary}\n`;
        } else {
          // summary가 없는 경우 기본 task 표시
          report += `• ${item.task}\n`;
        }
      });
    } else {
      report += `보고할 업무가 없습니다`;
    }

    return report;
  }

  private formatMonthlyReport(analysis: ChannelAnalysis): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = lastMonth.toLocaleDateString('ko-KR', { month: 'long' });
    
    let report = `*월간 업무 보고*\n`;
    report += `_대상 기간: ${monthName}_\n\n`;
    
    if (analysis.insights?.actionItems && analysis.insights.actionItems.length > 0) {
      analysis.insights.actionItems.forEach((item: any, index: number) => {
        if (typeof item === 'string') {
          // 이전 형식 호환성
          report += `• ${item}\n`;
        } else if (item.summary) {
          // 한 줄 요약 형식
          report += `• ${item.summary}\n`;
        } else {
          // summary가 없는 경우 기본 task 표시
          report += `• ${item.task}\n`;
        }
      });
    } else {
      report += `보고할 업무가 없습니다`;
    }

    return report;
  }

}