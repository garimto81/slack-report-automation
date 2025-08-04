import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function listBotMessages() {
  console.log('봇이 작성한 메시지 목록 확인...\n');
  
  const client = new WebClient(process.env.SLACK_BOT_TOKEN!);
  const channelId = process.env.SLACK_CHANNEL_ID!;
  
  try {
    // 봇 정보 가져오기
    const authInfo = await client.auth.test();
    const botUserId = authInfo.user_id;
    
    // 최근 이틀간의 메시지 가져오기
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const history = await client.conversations.history({
      channel: channelId,
      oldest: (twoDaysAgo.getTime() / 1000).toString(),
      limit: 100
    });
    
    const botMessages = history.messages?.filter(msg => 
      msg.user === botUserId || msg.bot_id
    ) || [];
    
    console.log(`봇이 작성한 메시지 ${botMessages.length}개:\n`);
    
    botMessages.forEach((msg, index) => {
      const time = new Date(parseFloat(msg.ts!) * 1000).toLocaleString('ko-KR');
      console.log(`${index + 1}. [${time}]`);
      console.log(`   ${msg.text}`);
      console.log(`   타임스탬프: ${msg.ts}`);
      console.log('');
    });
    
    console.log('\n💡 메시지 삭제 방법:');
    console.log('1. Slack 앱에서 각 메시지 위에 마우스 호버');
    console.log('2. "..." 메뉴 클릭');
    console.log('3. "Delete message" 선택');
    console.log('\n또는 봇 앱의 권한 설정에서 chat:write:bot 권한을 추가해야 합니다.');
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
  }
}

listBotMessages();