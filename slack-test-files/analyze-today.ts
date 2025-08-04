import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';
import { ReportService } from './src/services/report.service';

dotenv.config();

async function analyzeTodayAndReport() {
  console.log('오늘의 업무 분석 시작...\n');
  
  try {
    // Initialize services
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    
    // ReportService without Supabase for now
    const reportService = new ReportService(slackService, null as any, geminiService);
    
    const channelId = process.env.SLACK_CHANNEL_ID!;
    const dmUserId = process.env.SLACK_DM_USER_ID!;
    
    console.log(`채널: ${channelId}`);
    console.log(`보고서 수신자: ${dmUserId}`);
    
    // Get today's messages (from midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`\n${today.toLocaleDateString('ko-KR')}의 메시지 가져오는 중...`);
    const messages = await slackService.getChannelMessages(channelId, today);
    
    console.log(`✅ ${messages.length}개의 메시지를 찾았습니다.`);
    
    if (messages.length === 0) {
      await slackService.sendDirectMessage(
        dmUserId,
        '📊 *일일 업무 보고*\n\n오늘은 채널에 업무 관련 메시지가 없습니다.'
      );
      return;
    }
    
    // Analyze with Gemini
    console.log('\nGemini AI로 업무 분석 중...');
    const analysis = await geminiService.analyzeMessages(messages, 'daily');
    
    // Format and send report using the report service
    const formatDailyReport = (reportService as any).formatDailyReport.bind(reportService);
    const reportText = formatDailyReport(analysis);
    
    console.log('\n보고서 전송 중...');
    await slackService.sendDirectMessage(dmUserId, reportText);
    
    console.log('✅ 오늘의 업무 보고서가 성공적으로 전송되었습니다!');
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
  }
}

analyzeTodayAndReport();