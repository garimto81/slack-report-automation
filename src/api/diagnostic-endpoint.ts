import { NextApiRequest, NextApiResponse } from 'next';
import { TimeoutTracker } from '../utils/timeout-diagnostics';

// Vercel API Route 예시 (api/diagnose.ts)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tracker = new TimeoutTracker();
  
  // Vercel 함수 타임아웃 설정
  const VERCEL_TIMEOUT = process.env.VERCEL_TIMEOUT || 50000;
  const clearTimeout = createTimeoutResponse(res, tracker, Number(VERCEL_TIMEOUT));

  try {
    tracker.startPhase('API Initialization');
    
    // CORS 및 메서드 체크
    if (req.method !== 'POST') {
      tracker.endPhase();
      clearTimeout();
      return res.status(405).json({ error: 'Method not allowed' });
    }

    tracker.endPhase();

    // 요청 파싱
    tracker.startPhase('Request Parsing');
    const { action, params } = req.body;
    tracker.endPhase();

    // 진단 액션 실행
    let result;
    switch (action) {
      case 'test-slack':
        result = await testSlackConnection(tracker, params);
        break;
      
      case 'test-full-flow':
        result = await testFullReportFlow(tracker, params);
        break;
      
      case 'analyze-timeout':
        result = await analyzeTimeoutPattern(tracker, params);
        break;
      
      default:
        result = { error: 'Unknown action' };
    }

    // 진단 결과 반환
    clearTimeout();
    
    return res.status(200).json({
      success: true,
      result,
      diagnostics: tracker.getReport(),
      metrics: {
        totalDuration: performance.now(),
        phaseCount: tracker.diagnostics.length
      }
    });

  } catch (error) {
    tracker.captureError(error as Error, { endpoint: 'diagnose' });
    clearTimeout();
    
    return res.status(500).json({
      success: false,
      error: (error as Error).message,
      diagnostics: tracker.getReport()
    });
  }
}

function createTimeoutResponse(res: NextApiResponse, tracker: TimeoutTracker, timeout: number) {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Function timeout',
        diagnostics: tracker.getReport(),
        message: 'Operation exceeded Vercel timeout limit'
      });
    }
  }, timeout - 1000); // 1초 전에 응답

  return () => clearTimeout(timeoutId);
}

async function testSlackConnection(tracker: TimeoutTracker, params: any) {
  tracker.startPhase('Slack Connection Test');
  
  // Slack API 연결 테스트 로직
  const mockDelay = Math.random() * 5000;
  await new Promise(resolve => setTimeout(resolve, mockDelay));
  
  tracker.endPhase();
  
  return {
    status: 'connected',
    latency: mockDelay,
    channelAccess: true
  };
}

async function testFullReportFlow(tracker: TimeoutTracker, params: any) {
  const steps = [
    { name: 'Fetch Messages', delay: 8000 },
    { name: 'Process Threads', delay: 5000 },
    { name: 'AI Analysis', delay: 15000 },
    { name: 'Format Report', delay: 1000 },
    { name: 'Save to DB', delay: 2000 },
    { name: 'Send DMs', delay: 3000 }
  ];

  const results = [];
  
  for (const step of steps) {
    tracker.startPhase(step.name);
    
    // 실제 지연 시뮬레이션
    const actualDelay = step.delay * (0.8 + Math.random() * 0.4);
    await new Promise(resolve => setTimeout(resolve, actualDelay));
    
    tracker.endPhase();
    results.push({ step: step.name, expected: step.delay, actual: actualDelay });
  }

  return { steps: results };
}

async function analyzeTimeoutPattern(tracker: TimeoutTracker, params: any) {
  // 최근 타임아웃 패턴 분석
  tracker.startPhase('Timeout Pattern Analysis');
  
  const patterns = {
    mostCommonPhase: 'AI Analysis',
    averageTimeout: 45000,
    peakHours: ['09:00', '14:00', '18:00'],
    recommendations: [
      'Implement request queuing during peak hours',
      'Cache AI responses for similar queries',
      'Use webhook responses instead of synchronous'
    ]
  };
  
  tracker.endPhase();
  
  return patterns;
}

// 환경 변수 기반 동적 타임아웃 설정
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    // Vercel 함수 타임아웃 (Pro: 60s, Hobby: 10s)
    maxDuration: process.env.VERCEL_PLAN === 'pro' ? 60 : 10
  }
};