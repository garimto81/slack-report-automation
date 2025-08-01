import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function testSimpleDM() {
  console.log('=== Simple Slack DM Test ===\n');
  
  const token = process.env.SLACK_BOT_TOKEN;
  const userIds = process.env.SLACK_DM_USER_IDS;
  
  if (!token || !userIds) {
    console.error('Missing environment variables');
    console.error('SLACK_BOT_TOKEN:', token ? 'Set' : 'Not set');
    console.error('SLACK_DM_USER_IDS:', userIds ? 'Set' : 'Not set');
    return;
  }
  
  const client = new WebClient(token);
  const userIdList = userIds.split(',').map(id => id.trim());
  
  console.log('Testing with user IDs:', userIdList);
  
  // Test 1: Auth test
  try {
    const auth = await client.auth.test();
    console.log('\n✅ Bot authenticated');
    console.log('Bot name:', auth.user);
    console.log('Bot ID:', auth.user_id);
    console.log('Team:', auth.team);
  } catch (error: any) {
    console.error('\n❌ Auth failed:', error.message);
    return;
  }
  
  // Test 2: Send simple message
  for (const userId of userIdList) {
    console.log(`\n--- Testing DM to ${userId} ---`);
    
    try {
      // Method 1: Direct DM
      console.log('Attempt 1: Direct message...');
      const result1 = await client.chat.postMessage({
        channel: userId,
        text: `Test message 1: Direct DM at ${new Date().toLocaleString()}`
      });
      console.log('✅ Direct message sent:', result1.ok);
      
      // Method 2: Open conversation first
      console.log('\nAttempt 2: Open conversation first...');
      const open = await client.conversations.open({
        users: userId
      });
      console.log('Conversation opened:', open.ok, 'Channel:', open.channel?.id);
      
      if (open.channel?.id) {
        const result2 = await client.chat.postMessage({
          channel: open.channel.id,
          text: `Test message 2: Via conversation at ${new Date().toLocaleString()}`
        });
        console.log('✅ Message via conversation sent:', result2.ok);
      }
      
    } catch (error: any) {
      console.error(`\n❌ Failed to send to ${userId}`);
      console.error('Error:', error.message);
      if (error.data?.error) {
        console.error('Error code:', error.data.error);
      }
    }
  }
  
  console.log('\n=== Test complete ===');
}

testSimpleDM();