# Slack Report Automation

슬랙 채널을 Gemini AI로 분석하여 자동으로 일일/주간/월간 보고서를 생성하고 DM으로 전송하는 시스템입니다.

## 기능

- 🤖 Gemini AI를 활용한 지능형 채널 분석
- 📊 일일/주간/월간 채널 활동 인사이트
- 📨 지정된 사용자에게 DM으로 보고서 전송
- 💾 Supabase에 보고서 히스토리 저장
- ⏰ GitHub Actions를 통한 자동 스케줄링
- 🔍 감정 분석, 주요 토픽, 액션 아이템 추출

## 설정 방법

### 1. Slack 앱 생성

1. [api.slack.com/apps](https://api.slack.com/apps)에서 새 앱 생성
2. OAuth & Permissions에서 다음 권한 추가:
   - `channels:history` - 채널 메시지 읽기
   - `chat:write` - 메시지 전송
   - `im:write` - DM 전송
3. Bot User OAuth Token 복사

### 2. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_create_reports_table.sql` 실행
3. Project URL과 anon key 복사

### 3. Gemini AI 설정

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API Key 발급
2. 생성된 API Key 복사

### 4. GitHub 저장소 설정

1. 이 코드를 GitHub 저장소에 푸시
2. Settings > Secrets and variables > Actions에서 다음 시크릿 추가:
   - `SLACK_BOT_TOKEN`
   - `SLACK_CHANNEL_ID` (분석할 채널 ID)
   - `SLACK_DM_USER_IDS` (보고서 받을 사용자 ID들, 쉼표로 구분. 예: U1234567890,U0987654321)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

### 5. 로컬 개발

```bash
# 의존성 설치
npm install

# .env 파일 생성 (`.env.example` 참고)
cp .env.example .env

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 사용 방법

### GitHub Actions (자동 실행)

- 일일 보고서: 매일 오전 9시 UTC
- 주간 보고서: 매주 월요일 오전 9시 UTC  
- 월간 보고서: 매월 1일 오전 9시 UTC

수동 실행: Actions 탭에서 "Run workflow" 클릭

### 로컬 실행

```bash
# 특정 보고서 생성
node dist/generate-report.js --type daily
node dist/generate-report.js --type weekly
node dist/generate-report.js --type monthly

# 스케줄러 실행 (계속 실행됨)
npm start
```

## 보고서 내용

### 일일 보고서
- AI 기반 일일 활동 요약
- 감정 분석 (긍정/중립/부정)
- 상위 기여자 및 기여 내용
- 주요 토픽 및 액션 아이템

### 주간 보고서
- AI 기반 주간 인사이트
- 주요 의사결정 사항
- 우려사항 및 이슈 추적
- 상위 기여자 분석

### 월간 보고서
- AI 기반 월간 종합 분석
- 주요 토론 주제 심층 분석
- 트렌드 키워드 및 맥락
- 전체 기여자 순위 및 영향력

## 라이선스

MIT