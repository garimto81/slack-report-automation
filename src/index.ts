import * as dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';
import { Scheduler } from './utils/scheduler';

dotenv.config();

async function main() {
  // Validate environment variables
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_ID',
    'SLACK_DM_USER_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GEMINI_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Initialize services
  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
  const supabaseService = new SupabaseService(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  const { GeminiService } = await import('./services/gemini.service');
  const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
  const reportService = new ReportService(slackService, supabaseService, geminiService);

  // Initialize scheduler
  const scheduler = new Scheduler(
    reportService,
    process.env.SLACK_CHANNEL_ID!,
    process.env.SLACK_DM_USER_ID!
  );

  // Parse scheduling configuration
  const dailyTime = process.env.DAILY_REPORT_TIME || '09:00';
  const [hour, minute] = dailyTime.split(':');
  const dailyCron = `${minute} ${hour} * * *`;
  
  const weeklyDay = parseInt(process.env.WEEKLY_REPORT_DAY || '1');
  const monthlyDay = parseInt(process.env.MONTHLY_REPORT_DAY || '1');

  // Start scheduler
  scheduler.startScheduler(dailyCron, weeklyDay, monthlyDay);

  console.log('Slack Report Automation started successfully!');
  console.log(`Daily reports at: ${dailyTime}`);
  console.log(`Weekly reports on: Day ${weeklyDay} (0=Sunday, 6=Saturday)`);
  console.log(`Monthly reports on: Day ${monthlyDay}`);

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    scheduler.stopScheduler();
    process.exit(0);
  });
}

main().catch(console.error);