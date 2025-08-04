// =======================================
// Slack 리포트 자동화 시스템 타입 정의
// =======================================

export interface ChannelMessage {
  user: string;
  text: string;
  timestamp: string;
  thread_ts?: string;
  parent_user_id?: string;  // 쓰레드 원본 작성자
  reply_count?: number;     // 답글 수
  reply_users_count?: number; // 답글 작성자 수
  is_thread_reply?: boolean;  // 쓰레드 답글 여부
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


// =======================================
// 카메라 파트 업무 자동 보고 시스템 타입 정의
// =======================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  startDate?: Date;
  endDate?: Date;
  category?: string;
}

export interface CameraTask extends Task {
  assignee: 'Aiden Kim';
  category: 'camera';
}

export interface PrioritizedTask {
  task: Task;
  priorityScore: number;
  reasoning: string;
}

export interface ReportData {
  date: Date;
  tasks: PrioritizedTask[];
  totalTasks: number;
  cameraPartTasks: number;
}

export interface GoogleDocSection {
  date: string;
  part: string;
  taskName: string;
  description: string;
  progress: string;
}