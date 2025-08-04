import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function updateBotMessages() {
  console.log('봇이 작성한 메시지를 "."으로 수정 중...\n');
  
  const client = new WebClient(process.env.SLACK_BOT_TOKEN!);
  const channelId = process.env.SLACK_CHANNEL_ID!;
  
  try {
    // 1. 봇 정보 가져오기
    const authInfo = await client.auth.test();
    const botUserId = authInfo.user_id;
    console.log('봇 사용자 ID:', botUserId);
    
    // 2. 최근 메시지 가져오기
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    console.log('채널에서 봇 메시지 검색 중...');
    const history = await client.conversations.history({
      channel: channelId,
      oldest: (twoDaysAgo.getTime() / 1000).toString(),
      limit: 100
    });
    
    // 3. 봇이 작성한 메시지만 필터링
    const botMessages = history.messages?.filter(msg => 
      msg.user === botUserId && msg.text && !msg.text.includes('has joined the channel')
    ) || [];
    
    console.log(`수정할 봇 메시지 ${botMessages.length}개 발견\n`);
    
    if (botMessages.length === 0) {
      console.log('수정할 메시지가 없습니다.');
      return;
    }
    
    // 4. 각 메시지를 "."으로 수정
    let updatedCount = 0;
    for (const msg of botMessages) {
      try {
        if (msg.ts && msg.text !== '.') {
          // 메시지 미리보기
          const preview = msg.text.substring(0, 40);
          console.log(`수정 중: "${preview}..." → "."`);
          
          await client.chat.update({
            channel: channelId,
            ts: msg.ts,
            text: '.'
          });
          
          updatedCount++;
          // Rate limiting 방지
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        if (error.message.includes('cant_update_message')) {
          console.log('⚠️  이 메시지는 수정할 수 없습니다');
        } else if (error.message.includes('message_not_found')) {
          console.log('⚠️  메시지를 찾을 수 없습니다');
        } else if (error.message.includes('edit_window_closed')) {
          console.log('⚠️  메시지 수정 기한이 지났습니다');
        } else {
          console.error('수정 오류:', error.message);
        }
      }
    }
    
    console.log(`\n✅ 총 ${updatedCount}개의 메시지를 "."으로 수정했습니다.`);
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    if (error.data) {
      console.error('오류 상세:', error.data);
    }
  }
}

updateBotMessages();