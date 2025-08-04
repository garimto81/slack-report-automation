import * as dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';

dotenv.config();

async function generateReport() {
  console.log('=== Starting Report Generation ===');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--type');
  const reportType = typeIndex !== -1 ? args[typeIndex + 1] : 'daily';
  
  console.log(`Report type: ${reportType}`);
  
  // Validate environment variables
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_ID',
    'SLACK_DM_USER_IDS',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GEMINI_API_KEY'
  ];

  console.log('=== Checking Environment Variables ===');
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    } else {
      const value = process.env[envVar]!;
      const displayValue = envVar.includes('TOKEN') || envVar.includes('KEY') 
        ? value.substring(0, 10) + '...' 
        : value;
      console.log(`✅ ${envVar}: ${displayValue}`);
    }
  }

  // Parse DM user IDs
  const dmUserIds = process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim());
  console.log(`\n=== DM Recipients ===`);
  console.log(`User IDs: ${dmUserIds.join(', ')}`);
  console.log(`Total recipients: ${dmUserIds.length}`);

  // Initialize services
  console.log('\n=== Initializing Services ===');
  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
  console.log('✅ SlackService initialized');
  
  const supabaseService = new SupabaseService(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  console.log('✅ SupabaseService initialized');
  
  const { GeminiService } = await import('./services/gemini.service');
  const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
  console.log('✅ GeminiService initialized');
  
  const reportService = new ReportService(slackService, supabaseService, geminiService);
  console.log('✅ ReportService initialized');

  const channelId = process.env.SLACK_CHANNEL_ID!;
  console.log(`\nChannel ID: ${channelId}`);

  // Generate report based on type
  try {
    console.log(`\n=== Generating ${reportType} report ===`);
    const startTime = Date.now();
    
    switch (reportType) {
      case 'daily':
        await reportService.generateDailyReport(channelId, dmUserIds);
        break;
      case 'weekly':
        await reportService.generateWeeklyReport(channelId, dmUserIds);
        break;
      case 'monthly':
        await reportService.generateMonthlyReport(channelId, dmUserIds);
        break;
      default:
        console.error(`Invalid report type: ${reportType}`);
        process.exit(1);
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n✅ ${reportType} report generated successfully in ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Error generating report:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

generateReport();