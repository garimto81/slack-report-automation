import * as dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';

dotenv.config();

async function generateReport() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const reportType = args[0] || 'daily';

  // Validate environment variables
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_ID',
    'SLACK_DM_USER_IDS',
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

  const channelId = process.env.SLACK_CHANNEL_ID!;
  const dmUserIds = process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim());

  // Generate report based on type
  try {
    switch (reportType) {
      case 'daily':
        await reportService.generateDailyReport(channelId, dmUserIds);
        console.log('Daily report generated successfully');
        break;
      case 'weekly':
        await reportService.generateWeeklyReport(channelId, dmUserIds);
        console.log('Weekly report generated successfully');
        break;
      case 'monthly':
        await reportService.generateMonthlyReport(channelId, dmUserIds);
        console.log('Monthly report generated successfully');
        break;
      case 'monthly-weekly':
        await reportService.generateMonthlyWeeklyReport(channelId, dmUserIds);
        console.log('Monthly-weekly report generated successfully');
        break;
      default:
        console.error(`Invalid report type: ${reportType}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

generateReport();