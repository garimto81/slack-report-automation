import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function testSlackDM() {
  console.log('=== Testing Slack DM ===');
  
  // Check environment variables
  if (!process.env.SLACK_BOT_TOKEN) {
    console.error('Missing SLACK_BOT_TOKEN');
    return;
  }
  
  if (!process.env.SLACK_DM_USER_IDS) {
    console.error('Missing SLACK_DM_USER_IDS');
    return;
  }
  
  const token = process.env.SLACK_BOT_TOKEN;
  const userIds = process.env.SLACK_DM_USER_IDS.split(',').map(id => id.trim());
  
  console.log('Bot token:', token.substring(0, 20) + '...');
  console.log('User IDs:', userIds);
  
  const client = new WebClient(token);
  
  // Test bot auth
  try {
    console.log('\n=== Testing bot authentication ===');
    const authResult = await client.auth.test();
    console.log('Bot authenticated as:', authResult.user);
    console.log('Bot user ID:', authResult.user_id);
    console.log('Team:', authResult.team);
  } catch (error) {
    console.error('Auth test failed:', error);
    return;
  }
  
  // Test sending DM to each user
  for (const userId of userIds) {
    console.log(`\n=== Testing DM to ${userId} ===`);
    
    try {
      // First, try to open a conversation
      console.log('Opening conversation...');
      const openResult = await client.conversations.open({
        users: userId
      });
      console.log('Conversation opened:', openResult.ok);
      console.log('Channel ID:', openResult.channel?.id);
      
      // Then send a test message
      console.log('Sending test message...');
      const messageResult = await client.chat.postMessage({
        channel: userId,
        text: '🧪 Test message from Slack Report Automation\n\nIf you see this message, DM functionality is working correctly!'
      });
      console.log('Message sent:', messageResult.ok);
      console.log('Message timestamp:', messageResult.ts);
      
    } catch (error: any) {
      console.error('Failed to send DM to', userId);
      console.error('Error:', error.message);
      if (error.data) {
        console.error('Error data:', error.data);
      }
    }
  }
  
  console.log('\n=== Test complete ===');
}

testSlackDM();