# 변경 기록 (Changelog)

모든 주요 변경사항이 이 파일에 기록됩니다.

## [1.3.0] - 2025-08-04

### 🐛 버그 수정

#### 월간 보고서 스케줄 문제 해결
- **문제**: 월간 보고서가 매일 실행되는 심각한 버그
- **원인**: 잘못된 cron 표현식 `0 1 1-7 * 1`
- **해결**: 첫째 주 월요일 체크 로직으로 조건부 실행
- **결과**: 이제 월간 보고서는 매월 첫째 주 월요일에만 실행

#### 워크플로우 실행 경로 수정
- **문제**: 빌드된 파일 경로 불일치로 실행 실패
- **수정**: `dist/src/generate-report.js` → `dist/generate-report.js`
- **개선**: tsconfig.json의 rootDir 설정 최적화

### ✨ 새로운 기능

#### 주간 보고서 실행 로직 개선
- **Monthly-Weekly 보고서 추가**: 주간 데이터를 monthly 분석 타입으로 처리
- **10분 간격 실행**: 
  - 10:00 AM: Monthly-Weekly 보고서
  - 10:10 AM: 기존 주간 보고서
- **중복 방지**: 첫째 주 월요일은 월간 보고서만 실행

#### GitHub Pages 프로젝트 웹사이트
- **새로운 웹사이트**: `/docs` 디렉토리에 소개 페이지 생성
- **반응형 디자인**: 모바일/데스크톱 최적화
- **시각적 설명**: 
  - 프로젝트 기능 소개
  - AI 분석 방식 설명
  - 작동 프로세스 다이어그램
  - 실행 스케줄 캘린더
  - 기술 스택 소개

#### 디버깅 기능 강화
- **새로운 워크플로우**: `debug-report.yml` 추가
- **AI 중심 분석**: 키워드 검색 대신 문맥 분석 디버깅
- **상세 로깅**: 메시지 수집부터 AI 분석까지 전 과정 추적

### 🔧 개선사항

#### 워크플로우 관리
- **통합 워크플로우**: `reports.yml`에서 모든 보고서 타입 관리
- **스케줄 정리**: 중복 제거 및 시간 최적화
- **수동 실행**: `monthly-weekly` 옵션 추가

#### 코드 품질
- **타입 정의**: ChannelMessage 인터페이스 개선
- **에러 처리**: 쓰레드 수집 실패 시 메인 메시지 유지
- **로깅 개선**: 더 상세한 실행 상태 정보

### 📚 문서화

#### 새로운 문서
- **GitHub Pages**: 시각적 프로젝트 소개
- **디버깅 가이드**: 문제 해결 워크플로우

#### 업데이트된 문서
- **README.md**: 최신 기능 및 스케줄 반영
- **TECHNICAL_DETAILS.md**: 새로운 워크플로우 로직 설명
- **REPORT_SCHEDULE.md**: 10분 간격 실행 반영

### ⚠️ 주의사항
- **환경 변수**: 기존 `SLACK_DM_USER_IDS` 유지 (변경 없음)
- **하위 호환성**: 기존 수동 실행 명령어 모두 유지
- **마이그레이션**: 별도 작업 불필요 (자동 적용)

### 🔍 확인된 기능
- **쓰레드 분석**: conversations.replies API로 답글까지 완전 분석
- **AI 추론**: 키워드가 아닌 문맥 기반 카메라 파트 업무 판단
- **다중 사용자**: 여러 담당자에게 동시 DM 전송 정상 작동

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