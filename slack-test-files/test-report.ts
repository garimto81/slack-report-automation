import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';

dotenv.config();

async function testReport() {
  console.log('Starting test report generation...\n');
  
  // Validate required environment variables
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
    
    // Get messages from the last 24 hours
    const since = new Date();
    since.setHours(since.getHours() - 24);
    
    console.log(`Fetching messages from channel ${process.env.SLACK_CHANNEL_ID} since ${since.toISOString()}...`);
    const messages = await slackService.getChannelMessages(process.env.SLACK_CHANNEL_ID!, since);
    
    console.log(`Found ${messages.length} messages\n`);
    
    if (messages.length === 0) {
      console.log('No messages found in the specified time range.');
      console.log('Sending test message to verify DM functionality...');
      
      await slackService.sendDirectMessage(
        process.env.SLACK_DM_USER_ID!,
        '🧪 *Test Report*\\n\\nNo messages found in the channel for analysis. This is a test message to verify the bot can send DMs.'
      );
      console.log('Test message sent successfully!');
      return;
    }
    
    // Analyze messages with Gemini
    console.log('Analyzing messages with Gemini AI...');
    const analysis = await geminiService.analyzeMessages(messages, 'daily');
    
    // Format report
    let report = `🧪 *Test Daily Report*\n\n`;
    report += `📊 Channel: <#${process.env.SLACK_CHANNEL_ID}>\n`;
    report += `📅 Period: Last 24 hours\n`;
    report += `📨 Total messages: ${analysis.totalMessages}\n`;
    report += `👥 Active users: ${analysis.activeUsers.length}\n\n`;
    
    if (analysis.summary) {
      report += `*AI Summary:*\n${analysis.summary}\n\n`;
    }
    
    if (analysis.topContributors && analysis.topContributors.length > 0) {
      report += `*Top Contributors:*\n`;
      analysis.topContributors.slice(0, 3).forEach((c, i) => {
        report += `${i + 1}. <@${c.user}> - ${c.messageCount} messages`;
        if (c.contribution) report += ` (${c.contribution})`;
        report += '\n';
      });
    }
    
    // Send test report
    console.log('\nSending test report to user...');
    await slackService.sendDirectMessage(process.env.SLACK_DM_USER_ID!, report);
    
    console.log('✅ Test report sent successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testReport();