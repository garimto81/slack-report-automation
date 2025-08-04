import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChannelMessage, ChannelAnalysis } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeMessages(messages: ChannelMessage[], reportType: 'daily' | 'weekly' | 'monthly'): Promise<ChannelAnalysis> {
    // 메시지를 텍스트로 변환 (쓰레드 구조 표시)
    const messageText = messages.map(msg => {
      const prefix = msg.is_thread_reply ? '  └─ ' : '';
      const threadInfo = msg.is_thread_reply ? ` (답글)` : msg.reply_count ? ` (답글 ${msg.reply_count}개)` : '';
      return `${prefix}${msg.user}: ${msg.text}${threadInfo}`;
    }).join('\n');

    const prompt = this.buildPrompt(messageText, reportType, messages.length);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // 기본 통계 추가
        analysis.totalMessages = messages.length;
        analysis.activeUsers = [...new Set(messages.map(m => m.user))];
        
        return analysis;
      }
      
      // 파싱 실패시 기본 분석 반환
      return this.getBasicAnalysis(messages);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getBasicAnalysis(messages);
    }
  }

  private buildPrompt(messageText: string, reportType: 'daily' | 'weekly' | 'monthly', messageCount: number): string {
    const periodMap: Record<'daily' | 'weekly' | 'monthly', string> = {
      daily: '일일',
      weekly: '주간',
      monthly: '월간'
    };

    return `슬랙 메시지를 분석하여 카메라 파트의 ${periodMap[reportType]} 업무만 추출하고 우선순위에 따라 정렬하세요.

메시지:
${messageText.substring(0, 10000)}

JSON 형식:
{
  "topContributors": [{"user": "사용자ID", "messageCount": 1}],
  "insights": {
    "actionItems": [
      {
        "task": "업무 제목",
        "who": "담당자",
        "when": "시기",
        "where": "장소/플랫폼",
        "what": "구체적 내용",
        "why": "목적/이유",
        "how": "방법/절차",
        "priority": 1,
        "summary": "한 줄 요약"
      }
    ]
  }
}

카메라 파트 관련 업무:
- 촬영 업무 (드론, 카메라, 영상, 사진)
- 장비 관리 (카메라, 렌즈, 조명, 삼각대 등)
- 영상 제작 (편집, 색보정, 렌더링)
- 클라이언트 촬영 프로젝트
- 장비 구매/렌탈/수리/점검
- 촬영 일정 관리

우선순위 기준 (priority: 1~5):
1. 긴급 클라이언트 촬영 또는 장비 고장
2. 예정된 촬영 업무
3. 장비 관리 및 점검
4. 영상 편집 및 후반 작업
5. 일반 행정 및 보고 업무

필수 규칙:
1. 카메라 파트와 관련 없는 업무는 제외
2. 6하 원칙으로 분석 후 한 줄 요약
3. summary는 "무엇을 + 목적/방법" 형식 (누가는 제외)
4. 우선순위가 높은 순서대로 정렬
5. 최대 10개 업무만 (중요도 높은 순)
6. 카메라/촬영/영상과 직접 관련된 업무만 포함

예시:
{
  "task": "신제품 홍보 영상 드론 촬영",
  "who": "촬영팀",
  "when": "오늘 오후 2시",
  "where": "팍스타워",
  "what": "신제품 홍보용 4K 항공 촬영",
  "why": "클라이언트 납품용",
  "how": "DJI Mavic 3 사용",
  "priority": 2,
  "summary": "신제품 홍보 영상을 위한 팍스타워 드론 촬영"
}

추가 설명 없이 JSON만 반환하세요.`;
  }

  private getBasicAnalysis(messages: ChannelMessage[]): ChannelAnalysis {
    // 기본 통계 분석
    const userMessageCount = new Map<string, number>();
    const wordFrequency = new Map<string, number>();

    messages.forEach(msg => {
      const count = userMessageCount.get(msg.user) || 0;
      userMessageCount.set(msg.user, count + 1);

      const words = msg.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          const freq = wordFrequency.get(word) || 0;
          wordFrequency.set(word, freq + 1);
        }
      });
    });

    const topContributors = Array.from(userMessageCount.entries())
      .map(([user, messageCount]) => ({ user, messageCount }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    const keywords = Array.from(wordFrequency.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMessages: messages.length,
      activeUsers: Array.from(userMessageCount.keys()),
      topContributors,
      keywords,
      sentiment: {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33
      }
    };
  }
}