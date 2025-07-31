import { WebClient } from '@slack/web-api';
import { ChannelMessage } from '../types';

export class SlackService {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async getChannelMessages(channelId: string, since: Date): Promise<ChannelMessage[]> {
    const messages: ChannelMessage[] = [];
    const oldest = Math.floor(since.getTime() / 1000).toString();

    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        oldest: oldest,
        limit: 1000
      });

      if (result.messages) {
        messages.push(...result.messages.map(msg => ({
          user: msg.user || 'unknown',
          text: msg.text || '',
          timestamp: msg.ts || '',
          thread_ts: msg.thread_ts,
          reactions: msg.reactions?.map(r => ({
            name: r.name || '',
            count: r.count || 0
          }))
        })));
      }
    } catch (error) {
      console.error('Error fetching channel messages:', error);
    }

    return messages;
  }


  async sendDirectMessage(userId: string, text: string): Promise<void> {
    try {
      await this.client.chat.postMessage({
        channel: userId,
        text: text
      });
    } catch (error) {
      console.error('Error sending direct message:', error);
    }
  }
}