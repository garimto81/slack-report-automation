# 기술 상세 문서

## 📊 일일 보고 메시지 수집 알고리즘

### 1. 시간 범위 계산

```typescript
// src/services/report.service.ts
async generateDailyReport(channelId: string, dmUserIds: string[]): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - 1);  // 정확히 24시간 전
```

**시간 계산 로직**:
- `new Date()`: 현재 시간 (로컬 시간대)
- `setDate(getDate() - 1)`: 날짜를 하루 전으로 설정
- 예시: 2025-08-01 10:00 AM → 2025-07-31 10:00 AM

### 2. Slack API 메시지 수집

```typescript
// src/services/slack.service.ts
async getChannelMessages(channelId: string, since: Date): Promise<ChannelMessage[]> {
  const messages: ChannelMessage[] = [];
  const oldest = Math.floor(since.getTime() / 1000).toString();
  
  const result = await this.client.conversations.history({
    channel: channelId,
    oldest: oldest,
    limit: 1000
  });
```

**API 파라미터 설명**:
- `channel`: 대상 채널 ID (예: C1234567890)
- `oldest`: Unix timestamp (초 단위) - 이 시간 이후 메시지만
- `limit`: 최대 1000개 (Slack API 제한)
- `latest`: 미지정 시 현재 시간까지

### 3. 메시지 데이터 구조

```typescript
interface ChannelMessage {
  user: string;        // 사용자 ID (U1234567890)
  text: string;        // 메시지 내용
  timestamp: string;   // Slack 타임스탬프 (ts)
  thread_ts?: string;  // 스레드 타임스탬프
  reactions?: {
    name: string;      // 이모지 이름
    count: number;     // 반응 수
  }[];
}
```

### 4. 다중 사용자 전송 로직 (v1.1.0)

```typescript
// 이전 (v1.0.0) - 단일 사용자
await this.slackService.sendDirectMessage(dmUserId, reportText);

// 현재 (v1.1.0) - 다중 사용자
for (const userId of dmUserIds) {
  await this.slackService.sendDirectMessage(userId, reportText);
}
```

**환경 변수 파싱**:
```typescript
// src/index.ts, src/generate-report.ts
const dmUserIds = process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim());
```

### 5. 시간대 고려사항

**현재 구현**:
- JavaScript `Date` 객체는 서버의 로컬 시간대 사용
- Slack API는 UTC timestamp 요구
- 변환: `Math.floor(since.getTime() / 1000)`

**한국 시간 예시**:
```
서버 시간 (KST): 2025-08-01 10:00:00 +0900
→ UTC 변환: 2025-08-01 01:00:00 +0000
→ Unix timestamp: 1722477600
```

### 6. 쓰레드 메시지 처리 (v1.2.0)

#### 구현된 쓰레드 수집 로직
```typescript
// 쓰레드가 있는 경우 답글 가져오기
if (msg.thread_ts && msg.reply_count && msg.reply_count > 0) {
  const threadResult = await this.client.conversations.replies({
    channel: channelId,
    ts: msg.thread_ts,
    oldest: oldest,  // 날짜 필터링 적용
    limit: 100      // 쓰레드당 최대 100개 답글
  });
  
  // 날짜 범위 내의 답글만 추가
  for (const reply of replies) {
    const replyTime = parseFloat(reply.ts || '0');
    const sinceTime = since.getTime() / 1000;
    
    if (replyTime >= sinceTime) {
      messages.push({
        ...reply,
        is_thread_reply: true,
        parent_user_id: msg.user
      });
    }
  }
}
```

#### 쓰레드 표시 형식
```
U1234567890: 프로젝트 진행 상황 공유합니다 (답글 5개)
  └─ U0987654321: 좋은 진행입니다! (답글)
  └─ U5555555555: 일정 조정이 필요할 것 같습니다 (답글)
```

### 7. 제한사항 및 개선점

#### 현재 제한사항
1. **메시지 수 제한**: 메인 메시지 최대 1000개
2. **쓰레드 제한**: 쓰레드당 최대 100개 답글
3. **페이지네이션 없음**: 제한 초과 시 누락
4. **파일/이미지 미처리**: 텍스트만 분석

#### 개선 제안

**1. 페이지네이션 구현**:
```typescript
async getChannelMessagesWithPagination(channelId: string, since: Date): Promise<ChannelMessage[]> {
  const messages: ChannelMessage[] = [];
  const oldest = Math.floor(since.getTime() / 1000).toString();
  let cursor: string | undefined;
  
  do {
    const result = await this.client.conversations.history({
      channel: channelId,
      oldest: oldest,
      limit: 200,
      cursor: cursor
    });
    
    if (result.messages) {
      messages.push(...this.transformMessages(result.messages));
    }
    
    cursor = result.response_metadata?.next_cursor;
  } while (cursor);
  
  return messages;
}
```

**2. 스레드 메시지 포함**:
```typescript
for (const msg of messages) {
  if (msg.thread_ts && msg.reply_count > 0) {
    const replies = await this.client.conversations.replies({
      channel: channelId,
      ts: msg.thread_ts
    });
    // 답글 처리
  }
}
```

**3. 정확한 24시간 계산**:
```typescript
// 현재 시간에서 정확히 24시간 빼기
const since = new Date();
since.setTime(since.getTime() - (24 * 60 * 60 * 1000));
```

### 7. Gemini AI 분석 프로세스

```typescript
// src/services/gemini.service.ts
async analyzeMessages(messages: ChannelMessage[], reportType: 'daily' | 'weekly' | 'monthly'): Promise<ChannelAnalysis> {
  // 1. 메시지를 텍스트로 변환
  const messageText = messages.map(msg => 
    `${msg.user}: ${msg.text}`
  ).join('\n');
  
  // 2. 프롬프트 생성 (카메라 파트 업무 필터링)
  const prompt = this.buildPrompt(messageText, reportType, messages.length);
  
  // 3. Gemini API 호출
  const result = await this.model.generateContent(prompt);
```

**카메라 파트 업무 우선순위**:
1. 긴급 장비 고장/클라이언트 촬영
2. 예정된 촬영 업무
3. 장비 관리 및 점검
4. 영상 편집/후반 작업
5. 일반 행정 업무

### 8. 데이터 저장 구조

```typescript
// Supabase 테이블 구조
interface Report {
  id?: number;
  type: 'daily' | 'weekly' | 'monthly';
  channel_id: string;
  analysis: ChannelAnalysis;
  sent_to: string;  // v1.1.0: "U123,U456,U789" 형태로 저장
  created_at: Date;
}
```

## 🔧 환경 설정

### 필수 환경 변수
```bash
# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C1234567890
SLACK_DM_USER_IDS=U1234567890,U0987654321  # v1.1.0: 복수형

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Gemini AI
GEMINI_API_KEY=AIzaSy...

# 스케줄러 (선택)
DAILY_REPORT_TIME=09:00
WEEKLY_REPORT_DAY=1
MONTHLY_REPORT_DAY=1
```

### GitHub Actions 스케줄
```yaml
schedule:
  # 한국시간 오전 10시 = UTC 오전 1시
  - cron: '0 1 * * 2-5'  # 화-금 일일 보고서
  - cron: '0 1 * * 1'    # 월요일 주간/월간 보고서
```

## 📈 성능 고려사항

1. **API Rate Limits**:
   - Slack: 분당 50+ 요청
   - Gemini: 분당 60 요청
   - Supabase: 프로젝트 설정에 따라 다름

2. **처리 시간**:
   - 메시지 수집: ~1-2초
   - AI 분석: ~3-5초
   - DM 전송: 사용자당 ~0.5초

3. **메모리 사용**:
   - 1000개 메시지: ~1-2MB
   - AI 프롬프트: 최대 10KB