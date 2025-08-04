import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { SupabaseService } from './src/services/supabase.service';
import { GeminiService } from './src/services/gemini.service';
import { ReportService } from './src/services/report.service';

dotenv.config();

async function generateRealReport() {
  console.log('실제 채널 데이터로 보고서 생성 중...\n');
  
  // Validate environment variables
  const requiredVars = ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID', 'SLACK_DM_USER_ID', 'GEMINI_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    return;
  }

  try {
    // Initialize services
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    
    // Supabase is optional for now (if anon key is not set)
    let supabaseService = null;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY !== 'your-anon-key') {
      supabaseService = new SupabaseService(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
    }
    
    const reportService = new ReportService(slackService, supabaseService as any, geminiService);
    
    const channelId = process.env.SLACK_CHANNEL_ID!;
    const dmUserId = process.env.SLACK_DM_USER_ID!;
    
    console.log(`채널 ID: ${channelId}`);
    console.log(`보고서 수신자: ${dmUserId}`);
    console.log('\n일일 보고서 생성 중...');
    
    // Generate daily report
    await reportService.generateDailyReport(channelId, dmUserId);
    
    console.log('✅ 일일 보고서가 성공적으로 전송되었습니다!');
    
    // Optional: Generate weekly report for testing
    const generateWeekly = process.argv.includes('--weekly');
    if (generateWeekly) {
      console.log('\n주간 보고서 생성 중...');
      await reportService.generateWeeklyReport(channelId, dmUserId);
      console.log('✅ 주간 보고서가 성공적으로 전송되었습니다!');
    }
    
    // Optional: Generate monthly report for testing
    const generateMonthly = process.argv.includes('--monthly');
    if (generateMonthly) {
      console.log('\n월간 보고서 생성 중...');
      await reportService.generateMonthlyReport(channelId, dmUserId);
      console.log('✅ 월간 보고서가 성공적으로 전송되었습니다!');
    }
    
  } catch (error: any) {
    console.error('❌ 보고서 생성 중 오류 발생:', error.message);
    
    if (error.message?.includes('missing_scope')) {
      console.error('\n📌 Slack 앱에 다음 권한을 추가해주세요:');
      console.error('   - channels:history (공개 채널 메시지 읽기)');
      console.error('   - groups:history (비공개 채널 메시지 읽기)');
      console.error('\n1. https://api.slack.com/apps 에서 앱 선택');
      console.error('2. OAuth & Permissions 메뉴에서 권한 추가');
      console.error('3. 앱을 워크스페이스에 재설치');
    }
  }
}

// Run the report generation
generateRealReport();