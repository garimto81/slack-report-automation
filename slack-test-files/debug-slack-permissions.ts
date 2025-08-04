import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function debugSlackPermissions() {
  console.log('Slack 권한 디버깅...\n');
  
  if (!process.env.SLACK_BOT_TOKEN) {
    console.error('SLACK_BOT_TOKEN이 설정되지 않았습니다.');
    return;
  }

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // 1. 봇 정보 및 권한 확인
    console.log('1. 봇 정보 확인...');
    const authTest = await client.auth.test();
    console.log('봇 ID:', authTest.user_id);
    console.log('팀 ID:', authTest.team_id);
    console.log('봇 이름:', authTest.user);
    console.log('');

    // 2. 채널 목록 확인 (봇이 속한 채널)
    console.log('2. 봇이 속한 채널 확인...');
    try {
      const channelsList = await client.conversations.list({
        types: 'public_channel,private_channel',
        limit: 100
      });
      
      const botChannels = channelsList.channels?.filter(ch => ch.is_member) || [];
      console.log(`봇이 속한 채널 수: ${botChannels.length}`);
      
      const targetChannel = botChannels.find(ch => ch.id === process.env.SLACK_CHANNEL_ID);
      if (targetChannel) {
        console.log(`✅ 대상 채널 발견: #${targetChannel.name} (${targetChannel.id})`);
      } else {
        console.log(`❌ 봇이 대상 채널 (${process.env.SLACK_CHANNEL_ID})에 속해있지 않습니다!`);
        console.log('봇이 속한 채널들:');
        botChannels.forEach(ch => console.log(`  - #${ch.name} (${ch.id})`));
      }
    } catch (error: any) {
      console.error('채널 목록 조회 실패:', error.message);
    }
    console.log('');

    // 3. 채널 정보 상세 확인
    console.log('3. 대상 채널 정보 확인...');
    try {
      const channelInfo = await client.conversations.info({
        channel: process.env.SLACK_CHANNEL_ID!
      });
      console.log('채널 이름:', channelInfo.channel?.name);
      console.log('채널 타입:', channelInfo.channel?.is_private ? '비공개' : '공개');
      console.log('봇 멤버 여부:', channelInfo.channel?.is_member ? '예' : '아니오');
    } catch (error: any) {
      console.error('채널 정보 조회 실패:', error.message);
    }
    console.log('');

    // 4. 메시지 읽기 권한 테스트
    console.log('4. 메시지 읽기 권한 테스트...');
    try {
      const testResult = await client.conversations.history({
        channel: process.env.SLACK_CHANNEL_ID!,
        limit: 1
      });
      console.log('✅ 메시지 읽기 성공! 권한이 있습니다.');
      console.log(`최근 메시지 수: ${testResult.messages?.length || 0}`);
    } catch (error: any) {
      console.error('❌ 메시지 읽기 실패:', error.message);
      if (error.data) {
        console.error('필요한 권한:', error.data.needed);
        console.error('현재 권한:', error.data.provided);
      }
    }
    console.log('');

    // 5. 봇 토큰 권한 스코프 확인
    console.log('5. 현재 봇 토큰의 권한 스코프...');
    console.log('토큰 시작 부분:', process.env.SLACK_BOT_TOKEN.substring(0, 20) + '...');
    
    // 토큰 타입 확인
    if (process.env.SLACK_BOT_TOKEN.startsWith('xoxb-')) {
      console.log('✅ Bot User OAuth Token 사용중');
    } else if (process.env.SLACK_BOT_TOKEN.startsWith('xoxp-')) {
      console.log('⚠️  User OAuth Token 사용중 - Bot Token을 사용해야 합니다!');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

debugSlackPermissions();