# 🔍 Timeout 진단 가이드

API Error: Request timed out 문제를 정확히 진단하고 해결하기 위한 종합 가이드입니다.

## 📊 진단 시스템 구성

### 1. TimeoutTracker 클래스
각 작업 단계별 실행 시간을 추적하고 병목 구간을 식별합니다.

```typescript
const tracker = new TimeoutTracker();

// 각 단계별 추적
tracker.startPhase('Fetch Slack Messages');
// ... 작업 수행 ...
tracker.endPhase();

// 최종 리포트 출력
console.log(tracker.getReport());
```

### 2. 진단 리포트 구조

```
========== TIMEOUT DIAGNOSTICS REPORT ==========
Total Execution Time: 52341.23ms
Vercel Limit: 50000ms
Status: ❌ TIMEOUT

--- Phase Breakdown ---
1. Fetch Slack Messages ❌
   Duration: 28543.12ms / 10000ms
   Metadata: {"channelId":"C123","messageCount":850}
   
2. AI Analysis ✅
   Duration: 18234.45ms / 20000ms
   
--- Bottlenecks Identified ---
⚠️ Fetch Slack Messages: 28543.12ms (54.6% of total)

--- Recommendations ---
• Slack API calls are taking too long. Consider:
  - Reducing message fetch limit
  - Implementing pagination
  - Caching recent messages
```

## 🧪 진단 테스트 실행

### 1. 전체 진단 테스트
```bash
# 일일 보고서 진단
node test-timeout-diagnostics.ts daily

# 주간 보고서 진단
node test-timeout-diagnostics.ts weekly

# 월간 보고서 진단
node test-timeout-diagnostics.ts monthly
```

### 2. 빠른 연결 테스트
```bash
# 각 서비스 연결 상태만 확인
node test-timeout-diagnostics.ts --quick-test
```

출력 예시:
```
🔌 Running quick connection test...

✅ Slack API: 234ms
✅ Gemini AI: 1523ms
❌ Supabase: Failed - Connection timeout
```

### 3. 성능 벤치마크
```bash
# 다양한 메시지 수로 성능 테스트
node test-timeout-diagnostics.ts --benchmark
```

## 🎯 주요 Timeout 원인과 해결책

### 1. Slack API Timeout (>10초)

**원인**:
- 많은 메시지 수집 (1000개 이상)
- 많은 스레드 처리
- API Rate Limit

**해결책**:
```typescript
// 1. 메시지 수 제한
const messages = await slack.conversations.history({
  channel: channelId,
  limit: 200, // 1000 → 200
  oldest: oldest
});

// 2. 병렬 스레드 처리
const BATCH_SIZE = 5;
const threadBatches = chunk(threadsToFetch, BATCH_SIZE);
for (const batch of threadBatches) {
  await Promise.all(batch.map(fetchThread));
}

// 3. 시간 범위 축소
const since = new Date();
since.setHours(since.getHours() - 12); // 24시간 → 12시간
```

### 2. Gemini AI Timeout (>20초)

**원인**:
- 프롬프트가 너무 김
- 복잡한 분석 요구
- API 응답 지연

**해결책**:
```typescript
// 1. 메시지 요약
const summarizedMessages = messages
  .slice(0, 500) // 최대 500개만
  .map(m => `${m.user}: ${m.text.substring(0, 100)}...`);

// 2. 스트리밍 응답 사용
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream) {
  // 청크별 처리
}

// 3. 간소화된 프롬프트
const simplePrompt = `Summarize key points in 3 bullets`;
```

### 3. Vercel Function Timeout

**원인**:
- Hobby 플랜: 10초 제한
- Pro 플랜: 60초 제한
- Cold Start 지연

**해결책**:
```typescript
// 1. vercel.json 설정
{
  "functions": {
    "api/reports.js": {
      "maxDuration": 60 // Pro 플랜 필요
    }
  }
}

// 2. 백그라운드 작업 사용
export default async function handler(req, res) {
  // 즉시 응답
  res.status(202).json({ 
    message: 'Processing started',
    jobId: jobId 
  });
  
  // 백그라운드에서 처리
  processInBackground(jobId, req.body);
}

// 3. Edge Functions 사용 (더 긴 실행 시간)
export const config = {
  runtime: 'edge',
  maxDuration: 300 // 5분
};
```

### 4. Database Timeout

**원인**:
- 연결 풀 고갈
- 대량 데이터 쿼리
- 네트워크 지연

**해결책**:
```typescript
// 1. 연결 풀 설정
const supabase = createClient(url, key, {
  db: {
    poolSize: 10,
    connectionTimeout: 5000
  }
});

// 2. 쿼리 최적화
const reports = await supabase
  .from('reports')
  .select('id, type, created_at') // 필요한 필드만
  .order('created_at', { ascending: false })
  .limit(10);

// 3. 재시도 로직
async function saveWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await supabase.from('reports').insert(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

## 📈 성능 최적화 전략

### 1. 캐싱 전략
```typescript
// Redis 또는 메모리 캐시 사용
const cache = new Map();

async function getCachedMessages(channelId: string) {
  const cacheKey = `messages:${channelId}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5분
      return cached.data;
    }
  }
  
  const messages = await fetchMessages(channelId);
  cache.set(cacheKey, { data: messages, timestamp: Date.now() });
  return messages;
}
```

### 2. 점진적 로딩
```typescript
// 사용자에게 진행 상황 전송
async function generateReportProgressive(channelId: string, userId: string) {
  // 1단계: 즉시 응답
  await sendDM(userId, "📊 보고서 생성을 시작합니다...");
  
  // 2단계: 메시지 수집
  const messages = await fetchMessages(channelId);
  await sendDM(userId, `✅ ${messages.length}개 메시지 수집 완료`);
  
  // 3단계: AI 분석
  const analysis = await analyzeMessages(messages);
  await sendDM(userId, "✅ AI 분석 완료");
  
  // 4단계: 최종 보고서
  await sendDM(userId, formatReport(analysis));
}
```

### 3. 스케일링 전략
```typescript
// 1. 수평 스케일링
const WORKER_COUNT = 4;
const workers = Array(WORKER_COUNT).fill(null).map(() => 
  new Worker('./report-worker.js')
);

// 2. 작업 분산
function distributeWork(messages: Message[]) {
  const chunks = chunk(messages, Math.ceil(messages.length / WORKER_COUNT));
  return Promise.all(
    chunks.map((chunk, i) => 
      workers[i].process(chunk)
    )
  );
}
```

## 🚨 긴급 대응 방안

### 즉시 적용 가능한 해결책

1. **메시지 수 제한**
```bash
# .env 파일에 추가
MAX_MESSAGES=200
MAX_THREAD_DEPTH=50
```

2. **시간 범위 축소**
```bash
# 24시간 → 6시간
REPORT_HOURS=6
```

3. **병렬 처리 비활성화**
```bash
# 순차 처리로 변경
ENABLE_PARALLEL=false
```

4. **AI 프롬프트 간소화**
```bash
# 간단한 분석만
AI_MODE=simple
```

## 📞 추가 지원

문제가 지속되면 다음 정보와 함께 이슈를 생성해주세요:

1. 진단 리포트 전체 내용
2. 환경 변수 설정 (민감한 정보 제외)
3. 발생 시간 및 빈도
4. Vercel 플랜 정보

GitHub Issues: https://github.com/garimto81/slack-report-automation/issues