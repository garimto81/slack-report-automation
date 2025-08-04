import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';

dotenv.config();

async function deleteBotMessages() {
  console.log('봇이 작성한 메시지 삭제 중...\n');
  
  const client = new WebClient(process.env.SLACK_BOT_TOKEN!);
  const channelId = process.env.SLACK_CHANNEL_ID!;
  
  try {
    // 1. 봇 정보 가져오기
    const authInfo = await client.auth.test();
    const botUserId = authInfo.user_id;
    console.log('봇 사용자 ID:', botUserId);
    
    // 2. 최근 메시지 가져오기 (오늘과 어제)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    console.log('\n채널에서 봇 메시지 검색 중...');
    const history = await client.conversations.history({
      channel: channelId,
      oldest: (yesterday.getTime() / 1000).toString(),
      limit: 100
    });
    
    if (!history.messages || history.messages.length === 0) {
      console.log('메시지를 찾을 수 없습니다.');
      return;
    }
    
    // 3. 봇이 작성한 메시지만 필터링
    const botMessages = history.messages.filter(msg => 
      msg.user === botUserId || msg.bot_id
    );
    
    console.log(`총 ${history.messages.length}개 중 봇 메시지 ${botMessages.length}개 발견\n`);
    
    if (botMessages.length === 0) {
      console.log('삭제할 봇 메시지가 없습니다.');
      return;
    }
    
    // 4. 각 메시지 삭제
    let deletedCount = 0;
    for (const msg of botMessages) {
      try {
        if (msg.ts) {
          // 메시지 내용 미리보기
          const preview = msg.text ? msg.text.substring(0, 50) : 'No text';
          console.log(`삭제 중: "${preview}..."`);
          
          await client.chat.delete({
            channel: channelId,
            ts: msg.ts
          });
          
          deletedCount++;
          // Rate limiting 방지
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error: any) {
        if (error.message.includes('cant_delete_message')) {
          console.log('⚠️  이 메시지는 삭제할 수 없습니다 (권한 부족)');
        } else if (error.message.includes('message_not_found')) {
          console.log('⚠️  메시지를 찾을 수 없습니다');
        } else {
          console.error('삭제 오류:', error.message);
        }
      }
    }
    
    console.log(`\n✅ 총 ${deletedCount}개의 봇 메시지를 삭제했습니다.`);
    
  } catch (error: any) {
    console.error('❌ 오류 발생:', error.message);
    if (error.data) {
      console.error('오류 상세:', error.data);
    }
  }
}

deleteBotMessages();