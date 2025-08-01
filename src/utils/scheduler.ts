import * as cron from 'node-cron';
import { ReportService } from '../services/report.service';

export class Scheduler {
  private dailyTask?: cron.ScheduledTask;
  private weeklyTask?: cron.ScheduledTask;
  private monthlyTask?: cron.ScheduledTask;

  constructor(
    private reportService: ReportService,
    private channelId: string,
    private dmUserIds: string[]
  ) {}

  startScheduler(
    dailyTime = '0 10 * * 1-5',  // Default: 10 AM on weekdays (Mon-Fri)
    weeklyDay = 1,               // Default: Monday
    monthlyDay = 1               // Default: 1st of month
  ): void {
    // 통합 스케줄러 - 평일 오전 10시에 실행
    this.dailyTask = cron.schedule(dailyTime, async () => {
      const now = new Date();
      const day = now.getDate();
      const dayOfWeek = now.getDay();
      
      // 보고서 타입 결정 (우선순위: 월간 > 주간 > 일일)
      if (dayOfWeek === 1) { // 월요일
        if (day >= 1 && day <= 7) {
          // 첫째 월요일 - 월간 보고서
          console.log('Running monthly report (First Monday)...');
          await this.reportService.generateMonthlyReport(this.channelId, this.dmUserIds);
        } else {
          // 나머지 월요일 - 주간 보고서
          console.log('Running weekly report (Non-first Monday)...');
          await this.reportService.generateWeeklyReport(this.channelId, this.dmUserIds);
        }
      } else if (dayOfWeek >= 2 && dayOfWeek <= 5) {
        // 화-금 - 일일 보고서
        console.log('Running daily report...');
        await this.reportService.generateDailyReport(this.channelId, this.dmUserIds);
      }
    });

    console.log('Unified scheduler started - Reports will run at 10 AM KST');
    console.log('- First Monday: Monthly report');
    console.log('- Other Mondays: Weekly report');
    console.log('- Tuesday-Friday: Daily report');
  }

  stopScheduler(): void {
    this.dailyTask?.stop();
    console.log('Scheduler stopped');
  }
}