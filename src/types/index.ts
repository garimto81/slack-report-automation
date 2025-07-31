export interface ChannelMessage {
  user: string;
  text: string;
  timestamp: string;
  thread_ts?: string;
  reactions?: {
    name: string;
    count: number;
  }[];
}

export interface ChannelAnalysis {
  totalMessages: number;
  activeUsers: string[];
  topContributors: {
    user: string;
    messageCount: number;
    contribution?: string;
  }[];
  keywords: {
    word: string;
    count: number;
    context?: string;
  }[];
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    summary?: string;
  };
  insights?: {
    mainTopics?: string[];
    decisions?: string[];
    actionItems?: string[];
    concerns?: string[];
  };
  summary?: string;
}

export interface Report {
  id?: string;
  type: 'daily' | 'weekly' | 'monthly';
  channelId: string;
  analysis: ChannelAnalysis;
  createdAt: Date;
  sentTo: string;
}