import * as dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';

dotenv.config();

async function debugWeeklyReport() {
  console.log('=== Debugging Weekly Report ===\n');
  
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
    
    // Test date calculation
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const since = new Date(now.getFullYear(), now.getMonth(), diff - 7);
    since.setHours(0, 0, 0, 0);
    
    const until = new Date(since);
    until.setDate(until.getDate() + 6);
    until.setHours(23, 59, 59, 999);
    
    console.log('\n=== Date Range ===');
    console.log('From:', since.toISOString());
    console.log('To:', until.toISOString());
    
    // Get messages
    console.log('\n=== Fetching Messages ===');
    const messages = await slackService.getChannelMessages(channelId, since);
    console.log(`Found ${messages.length} messages`);
    
    if (messages.length === 0) {
      console.log('⚠️  No messages found in the specified period!');
      console.log('This might be why the weekly report is empty.');
      
      // Try to get recent messages to debug
      console.log('\n=== Checking Recent Messages ===');
      const recentSince = new Date();
      recentSince.setDate(recentSince.getDate() - 30);
      const recentMessages = await slackService.getChannelMessages(channelId, recentSince);
      console.log(`Found ${recentMessages.length} messages in the last 30 days`);
      
      if (recentMessages.length > 0) {
        console.log('\nMost recent message:');
        const latest = recentMessages[recentMessages.length - 1];
        console.log(`- Date: ${latest.timestamp}`);
        console.log(`- User: ${latest.user}`);
        console.log(`- Text: ${latest.text.substring(0, 100)}...`);
      }
    } else {
      // Analyze messages
      console.log('\n=== Analyzing Messages ===');
      const analysis = await geminiService.analyzeMessages(messages, 'weekly');
      console.log('Analysis insights:', JSON.stringify(analysis.insights, null, 2));
      
      // Create report service
      const reportService = new ReportService(slackService, supabaseService, geminiService);
      const reportText = reportService['formatWeeklyReport'](analysis);
      
      console.log('\n=== Report Text ===');
      console.log(reportText);
      console.log(`\nReport length: ${reportText.length} characters`);
      
      // Test sending
      console.log('\n=== Testing DM Send ===');
      for (const userId of userIds) {
        try {
          console.log(`Sending to ${userId}...`);
          await slackService.sendDirectMessage(userId, '📊 Weekly Report Debug Test\n\n' + reportText);
          console.log('✅ Sent successfully');
        } catch (error: any) {
          console.error(`❌ Failed to send to ${userId}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugWeeklyReport();