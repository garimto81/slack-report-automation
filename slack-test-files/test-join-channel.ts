import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function testJoinChannel() {
  console.log('채널 가입 및 권한 테스트...\n');
  
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID) {
    console.error('필수 환경 변수가 설정되지 않았습니다.');
    return;
  }

  const client = new WebClient(process.env.SLACK_BOT_TOKEN);
  const channelId = process.env.SLACK_CHANNEL_ID;
  
  try {
    // 1. 채널 가입 시도 (공개 채널인 경우)
    console.log('1. 채널 가입 시도...');
    try {
      await client.conversations.join({
        channel: channelId
      });
      console.log('✅ 채널 가입 성공 또는 이미 가입됨');
    } catch (error: any) {
      if (error.message.includes('already_in_channel')) {
        console.log('✅ 이미 채널에 가입되어 있습니다');
      } else if (error.message.includes('is_private')) {
        console.log('⚠️  비공개 채널이므로 수동으로 봇을 초대해야 합니다');
        console.log('\n비공개 채널에 봇 추가 방법:');
        console.log('1. Slack에서 해당 채널로 이동');
        console.log('2. 채널명 클릭 → Integrations 탭');
        console.log('3. "Add apps" 클릭');
        console.log('4. "ggpnotice" 봇 검색 후 추가');
      } else {
        console.error('❌ 채널 가입 실패:', error.message);
      }
    }
    console.log('');

    // 2. 테스트 메시지 전송
    console.log('2. 테스트 메시지 전송...');
    try {
      const testMessage = await client.chat.postMessage({
        channel: channelId,
        text: '🔍 슬랙 보고서 자동화 봇 권한 테스트 메시지입니다.'
      });
      console.log('✅ 메시지 전송 성공');
      console.log('메시지 타임스탬프:', testMessage.ts);
    } catch (error: any) {
      console.error('❌ 메시지 전송 실패:', error.message);
    }
    console.log('');

    // 3. 방금 보낸 메시지 읽기 시도
    console.log('3. 메시지 읽기 재시도...');
    try {
      const history = await client.conversations.history({
        channel: channelId,
        limit: 5
      });
      console.log('✅ 메시지 읽기 성공!');
      console.log(`읽은 메시지 수: ${history.messages?.length || 0}`);
      
      if (history.messages && history.messages.length > 0) {
        console.log('\n최근 메시지:');
        history.messages.slice(0, 3).forEach((msg, i) => {
          const time = new Date(parseFloat(msg.ts!) * 1000).toLocaleString('ko-KR');
          console.log(`${i + 1}. [${time}] ${msg.text?.substring(0, 50)}...`);
        });
      }
    } catch (error: any) {
      console.error('❌ 메시지 읽기 실패:', error.message);
      console.error('에러 상세:', error.data);
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

testJoinChannel();