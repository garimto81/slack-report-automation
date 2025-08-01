# 변경 기록 (Changelog)

모든 주요 변경사항이 이 파일에 기록됩니다.

## [1.2.0] - 2025-08-01

### 🎯 주요 기능 추가
- **쓰레드 메시지 수집**: 이제 슬랙 쓰레드의 모든 답글을 포함하여 더 완전한 대화 컨텍스트를 수집합니다.

### 🔄 변경사항

#### 쓰레드 처리 로직
- `conversations.replies` API를 사용하여 쓰레드 답글 수집
- 날짜 필터링 적용: 보고 기간 내의 답글만 포함
- 쓰레드당 최대 100개 답글 제한
- 타임스탬프 순으로 메시지 정렬

#### 타입 업데이트 (`src/types/index.ts`)
```typescript
export interface ChannelMessage {
  // 기존 필드...
  parent_user_id?: string;    // 쓰레드 원본 작성자
  reply_count?: number;       // 답글 수
  reply_users_count?: number; // 답글 작성자 수
  is_thread_reply?: boolean;  // 쓰레드 답글 여부
}
```

#### SlackService 개선 (`src/services/slack.service.ts`)
- 메인 메시지와 쓰레드 답글을 구분하여 수집
- 쓰레드 오류 발생 시에도 메인 메시지는 유지
- 시간 범위 검증으로 정확한 기간 데이터만 수집

#### GeminiService 개선 (`src/services/gemini.service.ts`)
- 쓰레드 구조를 시각적으로 표시 (`└─` 기호 사용)
- 답글 수 정보를 포함하여 AI 분석 정확도 향상

### 📈 성능 영향
- API 호출 증가: 쓰레드가 있는 메시지당 1회 추가 호출
- 처리 시간: 쓰레드 수에 따라 2-5배 증가 가능
- 메시지 수: 답글 포함으로 전체 메시지 수 증가

### ⚠️ 주의사항
- 쓰레드가 많은 채널의 경우 처리 시간이 길어질 수 있음
- API rate limit 고려 필요 (분당 50+ 요청)

## [1.1.0] - 2025-08-01

### 🎯 주요 기능 추가
- **다중 사용자 DM 지원**: 이제 여러 사용자에게 동시에 보고서를 전송할 수 있습니다.

### 🔄 변경사항

#### 환경 변수
- `SLACK_DM_USER_ID` → `SLACK_DM_USER_IDS`로 변경 (단수에서 복수형으로)
- 쉼표로 구분된 여러 사용자 ID 지원
  ```bash
  # 이전
  SLACK_DM_USER_ID=U080BA70DC4
  
  # 현재
  SLACK_DM_USER_IDS=U080BA70DC4,U1234567890,U9876543210
  ```

#### 코드 변경사항

**1. ReportService (`src/services/report.service.ts`)**
- 모든 보고서 생성 메서드가 `string[]` 타입의 사용자 ID 배열을 받도록 수정
- `generateDailyReport(channelId: string, dmUserIds: string[])`
- `generateWeeklyReport(channelId: string, dmUserIds: string[])`
- `generateMonthlyReport(channelId: string, dmUserIds: string[])`
- 각 사용자에게 개별적으로 DM 전송하는 로직 추가

**2. Scheduler (`src/utils/scheduler.ts`)**
- 생성자가 사용자 ID 배열을 받도록 수정
- `constructor(..., dmUserIds: string[])`
- 모든 스케줄된 작업이 여러 사용자에게 보고서 전송

**3. 메인 파일들 (`src/index.ts`, `src/generate-report.ts`)**
- 환경 변수 파싱 로직 추가
- `process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim())`
- 쉼표로 구분된 사용자 ID를 배열로 변환

**4. Supabase 저장 (`src/services/supabase.service.ts`)**
- `sentTo` 필드에 모든 수신자를 쉼표로 구분하여 저장
- 예: "U080BA70DC4,U1234567890"

#### 문서 업데이트
- `README.md` - 새로운 환경 변수 형식 설명
- `SETUP_GUIDE.md` - 다중 사용자 설정 방법 추가
- `GITHUB_ACTIONS_GUIDE.md` - GitHub Secrets 설정 예시 업데이트
- `REPORT_SCHEDULE.md` - 발송 대상 섹션 업데이트
- `troubleshooting-guide.md` - 새로운 환경 변수 관련 문제 해결
- `.env.example` - 다중 사용자 예시 추가

#### GitHub Actions
- `.github/workflows/reports.yml` - `SLACK_DM_USER_IDS` 환경 변수 사용

### 🚀 마이그레이션 가이드

기존 사용자가 업그레이드하는 방법:

1. **환경 변수 업데이트**
   ```bash
   # .env 파일에서
   # 이전: SLACK_DM_USER_ID=U080BA70DC4
   # 변경: SLACK_DM_USER_IDS=U080BA70DC4
   ```

2. **GitHub Secrets 업데이트**
   - Settings → Secrets and variables → Actions
   - `SLACK_DM_USER_ID` 삭제
   - `SLACK_DM_USER_IDS` 추가 (같은 값 사용 가능)

3. **여러 사용자 추가하기**
   ```bash
   SLACK_DM_USER_IDS=U080BA70DC4,U1234567890,U9876543210
   ```

### ⚠️ 주의사항
- 환경 변수 이름이 변경되었으므로 반드시 업데이트 필요
- 단일 사용자만 사용하더라도 새로운 형식 사용 필요
- 쉼표 뒤에 공백이 있어도 자동으로 제거됨

## [1.0.0] - 2025-07-31

### 🎉 초기 릴리스
- Slack 채널 메시지 분석
- Gemini AI를 활용한 카메라 파트 업무 추출
- 일일/주간/월간 보고서 자동 생성
- Slack DM으로 보고서 전송
- Supabase에 보고서 히스토리 저장
- GitHub Actions를 통한 자동 스케줄링