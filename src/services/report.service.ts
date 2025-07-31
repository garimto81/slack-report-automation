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

  async generateDailyReport(channelId: string, dmUserId: string): Promise<void> {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    const analysis = await this.geminiService.analyzeMessages(messages, 'daily');
    const reportText = this.formatDailyReport(analysis);

    await this.slackService.sendDirectMessage(dmUserId, reportText);

    const report: Report = {
      type: 'daily',
      channelId,
      analysis,
      sentTo: dmUserId,
      createdAt: new Date()
    };

    await this.supabaseService.saveReport(report);
  }

  async generateWeeklyReport(channelId: string, dmUserId: string): Promise<void> {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    const analysis = await this.geminiService.analyzeMessages(messages, 'weekly');
    const reportText = this.formatWeeklyReport(analysis);

    await this.slackService.sendDirectMessage(dmUserId, reportText);

    const report: Report = {
      type: 'weekly',
      channelId,
      analysis,
      sentTo: dmUserId,
      createdAt: new Date()
    };

    await this.supabaseService.saveReport(report);
  }

  async generateMonthlyReport(channelId: string, dmUserId: string): Promise<void> {
    const since = new Date();
    since.setMonth(since.getMonth() - 1);

    const messages = await this.slackService.getChannelMessages(channelId, since);
    const analysis = await this.geminiService.analyzeMessages(messages, 'monthly');
    const reportText = this.formatMonthlyReport(analysis);

    await this.slackService.sendDirectMessage(dmUserId, reportText);

    const report: Report = {
      type: 'monthly',
      channelId,
      analysis,
      sentTo: dmUserId,
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
    let report = `*주간 업무 보고*\n\n`;
    
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
    let report = `*월간 업무 보고*\n\n`;
    
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