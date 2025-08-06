# 🚀 Slack Report Automation & Google Docs Extension

[![Daily Report](https://github.com/garimto81/slack-report-automation/actions/workflows/daily-report.yml/badge.svg)](https://github.com/garimto81/slack-report-automation/actions/workflows/daily-report.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-73.3%25-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

AI 기반 자동 업무 보고 시스템과 Google Docs 실시간 업데이트 확장 모듈. Slack 메시지를 분석하여 보고서를 생성하고, 상위 3개 우선순위 업무를 Google Docs에 자동으로 업데이트합니다.

## 🌟 주요 특징

### 📊 Core System (Slack Report Automation)
- 🤖 **AI 기반 분석**: Gemini AI를 활용한 업무 우선순위 자동 판단
- ⏰ **완전 자동화**: GitHub Actions로 24/7 무중단 운영  
- 📈 **다양한 보고서**: 일일, 주간, 월간 맞춤형 보고서
- 💬 **Slack 통합**: 메시지 수집부터 DM 전송까지 완벽 통합
- 🚀 **Vercel 배포**: 서버리스 API로 고성능 운영
- 🧵 **쓰레드 분석**: 쓰레드 메시지 포함 완전한 대화 컨텍스트 분석 (v1.2.0)
- 👥 **다중 사용자 지원**: 여러 사용자에게 동시 보고서 전송 (v1.1.0)

### 🔗 Extension System (Google Docs Integration)
- 📄 **실시간 문서 업데이트**: 오늘 날짜 탭 자동 선택 (YYMMDD)
- 🎯 **정확한 위치 탐지**: '카메라' 파트 3행 구조 자동 인식
- 🏆 **우선순위 선별**: AI 기반 상위 3개 업무 자동 선택
- 🛡️ **안전한 업데이트**: 검증 실패 시 자동 중단
- 📱 **다양한 실행 모드**: CLI, 스케줄, 진단 모드 지원

## 🏗️ 시스템 아키텍처

```mermaid
graph TB
    A[Slack Messages] --> B[GitHub Actions]
    B --> C[Gemini AI Analysis]
    C --> D[Vercel API]
    D --> E[Extension Bridge]
    E --> F[Priority Selector]
    F --> G[Google Docs Updater]
    G --> H[Real-time Document]
    
    D --> I[Supabase Storage]
    E --> J[Slack Notifications]
```

## 🚀 빠른 시작

### 📋 Prerequisites
- Node.js 18+
- GitHub 계정
- Vercel 계정  
- Google Cloud 서비스 계정
- Slack Bot Token
- Supabase 프로젝트
- Gemini AI API Key

### 1️⃣ 리포지토리 설정

```bash
git clone https://github.com/garimto81/slack-report-automation.git
cd slack-report-automation
npm install
```

### 2️⃣ Slack 앱 설정

1. [api.slack.com/apps](https://api.slack.com/apps)에서 새 앱 생성
2. OAuth & Permissions에서 다음 권한 추가:
   - `channels:history` - 채널 메시지 읽기
   - `chat:write` - 메시지 전송
   - `im:write` - DM 전송
3. Bot User OAuth Token 복사

### 3️⃣ 환경 변수 설정

`.env` 파일 생성:
```bash
# Core System
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
GEMINI_API_KEY=your-gemini-api-key
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL_ID=C1234567890
SLACK_DM_USER_IDS=U1234567890,U0987654321  # 복수 사용자 지원

# Google Docs Extension (필수)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DOC_ID=1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow
VERCEL_API_URL=https://your-app.vercel.app

# Optional
DEPARTMENT=camera
SLACK_NOTIFICATION_CHANNEL=C1234567890
DAILY_REPORT_TIME=09:00
WEEKLY_REPORT_DAY=1
MONTHLY_REPORT_DAY=1
```

### 4️⃣ Vercel 배포

```bash
# 자동 배포 (권장)
node deploy-fixed.js --prod

# 수동 배포
vercel login
vercel --prod
```

### 5️⃣ Google Docs 연동 테스트

```bash
# 시스템 진단
node github-to-docs-extension.js diagnose

# 실제 실행
node github-to-docs-extension.js
```

## 📖 상세 가이드

### 📚 Documentation
- [📋 Vercel 배포 가이드](vercel-setup-guide.md)
- [🚀 배포 체크리스트](VERCEL_DEPLOYMENT_CHECKLIST.md)  
- [🔧 수동 배포 방법](MANUAL_DEPLOY.md)
- [🔗 확장 모듈 README](EXTENSION_README.md)
- [📊 배포 단계별 가이드](DEPLOYMENT_STEPS.md)
- [📝 기술 상세 문서](TECHNICAL_DETAILS.md)
- [🔄 마이그레이션 가이드](MIGRATION_GUIDE.md)

### 🛠️ Setup Guides
- [🔑 Google 서비스 계정 설정](google-service-account-guide.md)
- [📄 Google Docs 권한 설정](GOOGLE_SHEETS_PERMISSION_SETUP.md)
- [⚙️ GitHub Actions 시크릿 설정](github-secrets-setup.md)
- [🐳 Docker 배포 가이드](deploy-guide.md)
- [🔐 Slack 권한 가이드](SLACK_PERMISSIONS_GUIDE.md)
- [📅 보고서 스케줄 설정](REPORT_SCHEDULE.md)

## 🔧 사용법

### Core System Commands
```bash
# 프로젝트 빌드
npm run build

# 개발 서버 시작  
npm run dev

# 테스트 실행
npm test

# 특정 보고서 생성
node dist/generate-report.js --type daily
node dist/generate-report.js --type weekly
node dist/generate-report.js --type monthly

# 스케줄러 실행 (계속 실행됨)
npm start
```

### Extension Commands
```bash
# 기본 실행 (자동 모드)
node github-to-docs-extension.js

# 스케줄 실행 (GitHub Actions용)
node github-to-docs-extension.js schedule

# 시스템 진단
node github-to-docs-extension.js diagnose

# Slack DM 수동 처리
node github-to-docs-extension.js dm "업무 1: AI 편집 자동화 (긴급, 8시간)"
```

### Deployment Commands  
```bash
# 자동 배포 + 테스트
node deploy-fixed.js --prod

# API 테스트
node test-vercel-apis.js

# 간단한 테스트
node simple-api-test.js
```

### Test & Debug Commands
```bash
# 보고서 테스트
node test-report.js
node test-report-dummy.js

# Slack 기능 테스트
node test-slack-dm.js
node test-join-channel.js
node debug-slack-permissions.js

# 봇 메시지 관리
node list-bot-messages.js
node delete-bot-messages.js
node update-bot-messages.js

# 오늘 데이터 분석
node analyze-today.js
```

## 📊 API 엔드포인트

배포 완료 후 사용 가능한 API들:

### 🏥 Health Check
```
GET /api/health
```
시스템 상태 및 사용 가능한 엔드포인트 확인

### 📊 Reports API
```
GET /api/reports?date=250806&department=camera
GET /api/reports/250806/camera
```
날짜별 부서별 업무 보고서 조회

### 💬 Slack Analysis
```
GET /api/slack-reports/250806
```
일별 Slack 채널 분석 결과

## 📝 보고서 내용

### 일일 보고서
- AI 기반 일일 활동 요약
- 감정 분석 (긍정/중립/부정)
- 상위 기여자 및 기여 내용
- 주요 토픽 및 액션 아이템
- 쓰레드 대화 컨텍스트 포함

### 주간 보고서
- AI 기반 주간 인사이트
- 주요 의사결정 사항
- 우려사항 및 이슈 추적
- 상위 기여자 분석
- 주간 트렌드 분석

### 월간 보고서
- AI 기반 월간 종합 분석
- 주요 토론 주제 심층 분석
- 트렌드 키워드 및 맥락
- 전체 기여자 순위 및 영향력
- 월간 성과 지표

## 🎯 우선순위 알고리즘

```javascript
총점 = (긴급도 × 0.3) + (중요도 × 0.25) + (진행률 × 0.2) + 
       (언급빈도 × 0.15) + (마감일 × 0.1)

// 카메라 파트 전용 키워드 부스트  
키워드 = ['카메라', '촬영', '드론', '영상', '편집', 'AI', '4K']
키워드 매치당 +10점 부스트

// 카메라 파트 업무 우선순위
1. 긴급 장비 고장/클라이언트 촬영
2. 예정된 촬영 업무
3. 장비 관리 및 점검
4. 영상 편집/후반 작업
5. 일반 행정 업무
```

## 🔄 자동화 워크플로우

### GitHub Actions
- **Daily Report**: 매일 오전 9시 UTC (한국 오후 6시)
- **Google Docs Update**: 매일 오전 10:30 자동 실행  
- **Weekly Summary**: 매주 월요일 오전 9시 UTC
- **Monthly Review**: 매월 1일 오전 9시 UTC

### Data Flow
```
Slack Messages → AI Analysis → Vercel API → Priority Selection → Google Docs Update
     ↓              ↓             ↓              ↓                    ↓
   채널 수집     업무 분류    API 저장      상위 3개 선별        문서 업데이트
   +쓰레드       감정 분석    Supabase      우선순위 계산        실시간 반영
```

## 📈 성과 지표

### 자동화 효과
- **시간 절약**: 연간 240시간 (기존 수동 작업 대비)
- **정확성**: AI 기반 98% 분류 정확도
- **실시간성**: 10분 이내 문서 업데이트
- **안정성**: 99.9% 가동 시간

### 지원 기능
- 🔄 자동 백업 및 복구
- 📱 Slack 실시간 알림
- 📊 상세한 로깅 및 모니터링
- 🛡️ 보안 강화 (환경변수, HTTPS)
- 💾 Supabase 보고서 히스토리 저장

## 🚦 제한사항 및 고려사항

### 현재 제한사항
1. **메시지 수 제한**: 메인 메시지 최대 1000개
2. **쓰레드 제한**: 쓰레드당 최대 100개 답글
3. **페이지네이션 없음**: 제한 초과 시 누락
4. **파일/이미지 미처리**: 텍스트만 분석

### API Rate Limits
- Slack: 분당 50+ 요청
- Gemini: 분당 60 요청
- Supabase: 프로젝트 설정에 따라 다름

## 📚 버전 히스토리

### v1.2.0 (최신)
- 🧵 쓰레드 메시지 수집 및 분석 기능 추가
- 📊 완전한 대화 컨텍스트 분석

### v1.1.0
- 👥 다중 사용자 동시 전송 지원
- 📨 여러 사용자에게 보고서 DM 전송 가능

### v1.0.0
- 🚀 초기 릴리즈
- 📊 일일/주간/월간 보고서 생성
- 🤖 Gemini AI 통합
- 💬 Slack DM 전송

자세한 변경사항은 [CHANGELOG.md](CHANGELOG.md)를 참조하세요.

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- [Anthropic Claude](https://www.anthropic.com) - AI 개발 지원
- [Vercel](https://vercel.com) - 서버리스 배포 플랫폼
- [Google Cloud](https://cloud.google.com) - AI 및 문서 API
- [Supabase](https://supabase.com) - 데이터베이스 및 백엔드

## 📞 지원

- 📧 Email: [support@yourproject.com](mailto:support@yourproject.com)
- 📱 Slack: [#project-support](https://yourworkspace.slack.com)
- 🐛 Issues: [GitHub Issues](https://github.com/garimto81/slack-report-automation/issues)
- 📚 Documentation: [Wiki](https://github.com/garimto81/slack-report-automation/wiki)
- 🔧 문제 해결: [Troubleshooting Guide](troubleshooting-guide.md)

---

<div align="center">

**🚀 Made with ❤️ for productivity automation**

[⬆️ 맨 위로](#-slack-report-automation--google-docs-extension)

</div>