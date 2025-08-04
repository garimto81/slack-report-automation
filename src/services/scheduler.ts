import * as cron from 'node-cron';
import { ReportGenerator } from './reportGenerator';
import { config } from '../config';
import { GoogleDocsWriter } from './googleDocsWriter';

export class Scheduler {
  private reportGenerator: ReportGenerator;
  private docsWriter: GoogleDocsWriter;
  private dailyTask: cron.ScheduledTask | null = null;
  private retryTask: cron.ScheduledTask | null = null;
  private retryCount = 0;
  private maxRetries = 24;
  
  constructor() {
    this.reportGenerator = new ReportGenerator();
    this.docsWriter = new GoogleDocsWriter();
  }
  
  start() {
    console.log('Starting scheduler...');
    
    this.dailyTask = cron.schedule(config.schedule.dailyCron, async () => {
      console.log('Running daily report generation...');
      const success = await this.reportGenerator.generateReport();
      
      if (!success) {
        this.startRetrySchedule();
      }
    }, {
      scheduled: true,
      timezone: config.timezone
    });
    
    console.log(`Daily report scheduled at ${config.schedule.dailyCron} (${config.timezone})`);
  }
  
  private startRetrySchedule() {
    if (this.retryTask) {
      return;
    }
    
    console.log('Starting retry schedule...');
    this.retryCount = 0;
    
    const retryCron = `0 */${config.schedule.retryInterval} * * * *`;
    
    this.retryTask = cron.schedule(retryCron, async () => {
      this.retryCount++;
      console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      const success = await this.checkAndRetry();
      
      if (success || this.retryCount >= this.maxRetries) {
        this.stopRetrySchedule();
      }
    }, {
      scheduled: true,
      timezone: config.timezone
    });
  }
  
  private async checkAndRetry(): Promise<boolean> {
    try {
      const success = await this.reportGenerator.generateReport();
      return success;
    } catch (error) {
      console.error('Retry failed:', error);
      return false;
    }
  }
  
  private stopRetrySchedule() {
    if (this.retryTask) {
      this.retryTask.stop();
      this.retryTask = null;
      this.retryCount = 0;
      console.log('Retry schedule stopped');
    }
  }
  
  stop() {
    if (this.dailyTask) {
      this.dailyTask.stop();
    }
    this.stopRetrySchedule();
    console.log('Scheduler stopped');
  }
}