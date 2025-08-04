# Slack Report Automation

슬랙 채널을 Gemini AI로 분석하여 자동으로 일일/주간/월간 보고서를 생성하고 DM으로 전송하는 시스템입니다.

## 기능

- 🤖 Gemini AI를 활용한 지능형 채널 분석
- 📊 일일/주간/월간 채널 활동 인사이트
- 📨 여러 사용자에게 동시에 DM으로 보고서 전송
- 🧵 슬랙 쓰레드 메시지 포함 분석 ✨ **NEW**
- 💾 Supabase에 보고서 히스토리 저장
- ⏰ GitHub Actions를 통한 자동 스케줄링
- 🔍 감정 분석, 주요 토픽, 액션 아이템 추출

## 최신 업데이트 (v1.3.0)

- **🐛 월간 보고서 스케줄 버그 수정**: 매일 실행되던 문제 해결
- **⏰ 주간 보고서 개선**: monthly-weekly report 추가 (10분 간격 실행)
- **📖 GitHub Pages 문서**: 프로젝트 소개 웹사이트 추가
- **🔧 디버깅 강화**: AI 문맥 분석 중심의 디버깅 도구
- **🧵 쓰레드 메시지 수집**: 완전한 대화 컨텍스트 분석 (v1.2.0)
- **👥 다중 사용자 지원**: 여러 사용자에게 동시 보고서 전송 (v1.1.0)
- 자세한 변경사항은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.

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

### 6. 다중 사용자 설정

여러 사용자에게 보고서를 전송하려면:

1. **환경 변수에서**: `SLACK_DM_USER_IDS=U1234567890,U0987654321,U5555555555`
2. **GitHub Secrets에서**: 동일한 형식으로 설정
3. **사용자 ID 찾기**:
   - Slack에서 사용자 프로필 클릭
   - "View full profile" → "More" → "Copy member ID"

## 사용 방법

### GitHub Actions (자동 실행)

- **일일 보고서**: 평일(화-금) 오전 10시 KST
- **주간 보고서**: 매주 월요일 오전 10시 10분 KST (첫째 주 제외)
- **Monthly-Weekly 보고서**: 매주 월요일 오전 10시 KST (첫째 주 제외)
- **월간 보고서**: 매월 첫째 주 월요일 오전 10시 KST

수동 실행: Actions 탭에서 "Run workflow" 클릭

### 실행 스케줄 상세
```
첫째 주 월요일: 월간 보고서 (지난달 전체)
나머지 월요일: 
  - 10:00 AM: Monthly-Weekly 보고서 (7일 데이터, monthly 분석)
  - 10:10 AM: 주간 보고서 (7일 데이터, weekly 분석)
화-금요일: 일일 보고서 (24시간 데이터)
```

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

## 🌐 프로젝트 웹사이트

GitHub Pages로 배포된 프로젝트 소개 웹사이트에서 더 자세한 정보를 확인하세요:

**👉 [프로젝트 웹사이트 보기](https://garimto81.github.io/slack-report-automation/)**

웹사이트에서 제공하는 내용:
- 시각적 프로젝트 설명
- AI 분석 방식 상세 설명
- 작동 프로세스 다이어그램
- 실행 스케줄 캘린더
- 기술 스택 소개

## 🔧 문제 해결

### 자주 발생하는 문제

1. **보고서가 전송되지 않음**
   - GitHub Secrets 설정 확인
   - Slack 봇 권한 확인 ([SLACK_PERMISSIONS_GUIDE.md](SLACK_PERMISSIONS_GUIDE.md) 참조)
   - 채널에 봇이 추가되었는지 확인

2. **월간 보고서가 매일 실행됨** (v1.3.0에서 수정됨)
   - 최신 버전으로 업데이트
   - 첫째 주 월요일 체크 로직 적용됨

3. **디버깅이 필요한 경우**
   - Actions 탭에서 "Debug Report Issue" 워크플로우 실행
   - 메시지 수집 상태와 AI 분석 결과 확인

자세한 문제 해결 방법은 [troubleshooting-guide.md](troubleshooting-guide.md)를 참조하세요.

## 📚 관련 문서

- [📋 변경 기록](CHANGELOG.md)
- [🔧 기술 상세](TECHNICAL_DETAILS.md)
- [⚙️ 설정 가이드](SETUP_GUIDE.md)
- [🚀 GitHub Actions 가이드](GITHUB_ACTIONS_GUIDE.md)
- [🔐 Slack 권한 설정](SLACK_PERMISSIONS_GUIDE.md)
- [📅 보고서 스케줄](REPORT_SCHEDULE.md)
- [🔄 마이그레이션 가이드](MIGRATION_GUIDE.md)

## 🤝 기여하기

버그 리포트나 기능 요청은 [Issues](https://github.com/garimto81/slack-report-automation/issues)에 등록해 주세요.

## 라이선스

MIT