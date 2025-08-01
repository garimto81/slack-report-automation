import * as dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';

dotenv.config();

async function testWeeklyReport() {
  console.log('=== Testing Weekly Report Generation ===\n');
  
  // Check environment
  const channelId = process.env.SLACK_CHANNEL_ID;
  const userIds = process.env.SLACK_DM_USER_IDS?.split(',').map(id => id.trim());
  
  if (!channelId || !userIds) {
    console.error('Missing required environment variables');
    return;
  }
  
  console.log('Channel ID:', channelId);
  console.log('User IDs:', userIds);
  
  try {
    // Initialize services
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const supabaseService = new SupabaseService(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    const { GeminiService } = await import('./services/gemini.service');
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    
    // Create custom report service with debug
    const reportService = new ReportService(slackService, supabaseService, geminiService);
    
    // Get messages manually
    console.log('\n=== Fetching messages ===');
    const since = new Date();
    since.setDate(since.getDate() - 7);
    console.log('Since:', since.toISOString());
    
    const messages = await slackService.getChannelMessages(channelId, since);
    console.log(`Found ${messages.length} messages`);
    
    if (messages.length > 0) {
      console.log('\nFirst 3 messages:');
      messages.slice(0, 3).forEach((msg, i) => {
        console.log(`${i + 1}. ${msg.user}: ${msg.text.substring(0, 50)}...`);
      });
    }
    
    // Analyze messages
    console.log('\n=== Analyzing messages ===');
    const analysis = await geminiService.analyzeMessages(messages, 'weekly');
    console.log('Analysis result:', JSON.stringify(analysis, null, 2).substring(0, 500) + '...');
    
    // Format report
    console.log('\n=== Formatting report ===');
    const reportText = formatTestReport(analysis);
    console.log('Report text:');
    console.log(reportText);
    console.log(`\nReport length: ${reportText.length} characters`);
    
    // Test sending
    console.log('\n=== Testing DM send ===');
    for (const userId of userIds) {
      try {
        console.log(`Sending to ${userId}...`);
        await slackService.sendDirectMessage(userId, '📧 Weekly Report Test\n\n' + reportText);
        console.log('✅ Sent successfully');
      } catch (error: any) {
        console.error(`❌ Failed to send to ${userId}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

function formatTestReport(analysis: any): string {
  let report = `*주간 업무 보고 (테스트)*\n\n`;
  
  if (!analysis.insights?.actionItems || analysis.insights.actionItems.length === 0) {
    report += `분석된 업무가 없습니다.\n\n`;
    report += `총 메시지 수: ${analysis.totalMessages || 0}\n`;
    report += `활성 사용자: ${analysis.activeUsers?.length || 0}명\n`;
  } else {
    report += `발견된 업무 항목: ${analysis.insights.actionItems.length}개\n\n`;
    analysis.insights.actionItems.forEach((item: any, index: number) => {
      const text = item.summary || item.task || item;
      report += `${index + 1}. ${text}\n`;
    });
  }
  
  return report;
}

testWeeklyReport();