import { WebClient } from '@slack/web-api';
import { ChannelMessage } from '../types';

export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async getChannelMessages(channelId: string, since: Date, until?: Date): Promise<ChannelMessage[]> {
    const messages: ChannelMessage[] = [];
    const oldest = Math.floor(since.getTime() / 1000).toString();
    const latest = until ? Math.floor(until.getTime() / 1000).toString() : undefined;

    try {
      // 1. 메인 채널 메시지 가져오기
      const result = await this.client.conversations.history({
        channel: channelId,
        oldest: oldest,
        latest: latest,
        limit: 1000
      });

      if (result.messages) {
        // 2. 각 메시지 처리
        for (const msg of result.messages) {
          // 메인 메시지 추가
          messages.push({
            user: msg.user || 'unknown',
            text: msg.text || '',
            timestamp: msg.ts || '',
            thread_ts: msg.thread_ts,
            parent_user_id: msg.parent_user_id,
            reply_count: msg.reply_count,
            reply_users_count: msg.reply_users_count,
            is_thread_reply: false,
            reactions: msg.reactions?.map(r => ({
              name: r.name || '',
              count: r.count || 0
            }))
          });

          // 3. 쓰레드가 있는 경우 답글 가져오기
          if (msg.thread_ts && msg.reply_count && msg.reply_count > 0) {
            try {
              const threadResult = await this.client.conversations.replies({
                channel: channelId,
                ts: msg.thread_ts,
                oldest: oldest,  // 날짜 필터링 적용
                latest: latest,  // 종료 날짜 필터링 적용
                limit: 100      // 쓰레드당 최대 100개 답글
              });

              if (threadResult.messages && threadResult.messages.length > 1) {
                // 첫 번째 메시지는 이미 포함되어 있으므로 제외
                const replies = threadResult.messages.slice(1);
                
                // 4. 날짜 범위 내의 답글만 추가
                for (const reply of replies) {
                  const replyTime = parseFloat(reply.ts || '0');
                  const sinceTime = since.getTime() / 1000;
                  const untilTime = until ? until.getTime() / 1000 : Number.MAX_SAFE_INTEGER;
                  
                  if (replyTime >= sinceTime && replyTime <= untilTime) {
                    messages.push({
                      user: reply.user || 'unknown',
                      text: reply.text || '',
                      timestamp: reply.ts || '',
                      thread_ts: reply.thread_ts,
                      parent_user_id: msg.user,  // 원본 메시지 작성자
                      is_thread_reply: true,     // 쓰레드 답글 표시
                      reactions: reply.reactions?.map(r => ({
                        name: r.name || '',
                        count: r.count || 0
                      }))
                    });
                  }
                }
              }
            } catch (threadError) {
              console.error(`Error fetching thread replies for ${msg.thread_ts}:`, threadError);
              // 쓰레드 오류가 있어도 메인 메시지는 유지
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching channel messages:', error);
    }

    // 타임스탬프 순으로 정렬
    messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return messages;
  }


  async sendDirectMessage(userId: string, text: string): Promise<void> {
    try {
      console.log(`Attempting to send DM to user: ${userId}`);
      const result = await this.client.chat.postMessage({
        channel: userId,
        text: text
      });
      console.log(`DM sent successfully to ${userId}:`, result.ok);
    } catch (error: any) {
      console.error('Error sending direct message to', userId);
      console.error('Error details:', error);
      if (error.data) {
        console.error('Error response:', error.data);
      }
      throw error; // Re-throw to handle in report service
    }
  }
}