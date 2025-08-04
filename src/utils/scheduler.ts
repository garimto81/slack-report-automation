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
    dailyTime = '0 9 * * *',  // Default: 9 AM daily
    weeklyDay = 1,            // Default: Monday
    monthlyDay = 1            // Default: 1st of month
  ): void {
    // Daily report
    this.dailyTask = cron.schedule(dailyTime, async () => {
      console.log('Running daily report...');
      await this.reportService.generateDailyReport(this.channelId, this.dmUserIds);
    });

    // Weekly report (every Monday at 9 AM)
    this.weeklyTask = cron.schedule(`0 9 * * ${weeklyDay}`, async () => {
      console.log('Running weekly report...');
      await this.reportService.generateWeeklyReport(this.channelId, this.dmUserIds);
    });

    // Monthly report (1st of each month at 9 AM)
    this.monthlyTask = cron.schedule(`0 9 ${monthlyDay} * *`, async () => {
      console.log('Running monthly report...');
      await this.reportService.generateMonthlyReport(this.channelId, this.dmUserIds);
    });

    console.log('Scheduler started');
  }

  stopScheduler(): void {
    this.dailyTask?.stop();
    this.weeklyTask?.stop();
    this.monthlyTask?.stop();
    console.log('Scheduler stopped');
  }
}