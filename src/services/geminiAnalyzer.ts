import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task, PrioritizedTask } from '../types';
import { config } from '../config';

export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  
  async prioritizeTasks(tasks: Task[]): Promise<PrioritizedTask[]> {
    if (tasks.length === 0) return [];
    
    const prompt = `
다음은 카메라 파트의 현재 진행 중인 업무 목록입니다:

${tasks.map((task, index) => `
${index + 1}. ${task.title}
   - 진행률: ${task.progress}%
   - 상태: ${task.status}
   - 설명: ${task.description || '설명 없음'}
`).join('\n')}

위 업무들 중에서 가장 우선순위가 높은 3개의 업무를 선정해주세요.
선정 기준:
1. 비즈니스 임팩트
2. 긴급도
3. 의존성 (다른 업무에 영향을 주는 정도)
4. 현재 진행 상황

각 선정된 업무에 대해 다음 형식으로 응답해주세요:
[업무 번호] | [우선순위 점수 1-100] | [선정 이유]

예시:
2 | 95 | 고객 납품 관련 업무로 긴급도가 매우 높음
`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text, tasks);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      return tasks.slice(0, 3).map((task, index) => ({
        task,
        priorityScore: 90 - (index * 10),
        reasoning: '자동 우선순위 설정'
      }));
    }
  }
  
  private parseGeminiResponse(text: string, tasks: Task[]): PrioritizedTask[] {
    const lines = text.split('\n').filter(line => line.trim());
    const prioritizedTasks: PrioritizedTask[] = [];
    
    for (const line of lines) {
      const match = line.match(/(\d+)\s*\|\s*(\d+)\s*\|\s*(.+)/);
      if (match) {
        const taskIndex = parseInt(match[1]) - 1;
        const priorityScore = parseInt(match[2]);
        const reasoning = match[3].trim();
        
        if (taskIndex >= 0 && taskIndex < tasks.length) {
          prioritizedTasks.push({
            task: tasks[taskIndex],
            priorityScore,
            reasoning
          });
        }
      }
    }
    
    return prioritizedTasks
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
  }
}