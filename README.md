# 📊 Slack Report Automation

[![Daily Report](https://github.com/garimto81/slack-report-automation/actions/workflows/daily-report.yml/badge.svg)](https://github.com/garimto81/slack-report-automation/actions/workflows/daily-report.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-73.3%25-blue)](https://www.typescriptlang.org/)

AI 기반 자동 업무 보고 시스템 - Slack 메시지를 분석하여 일일/주간/월간 보고서를 자동으로 생성하고 전송합니다.

## 🌟 주요 특징

- 🤖 **AI 기반 분석**: Gemini AI를 활용한 업무 우선순위 자동 판단
- ⏰ **완전 자동화**: GitHub Actions로 24/7 무중단 운영
- 📈 **다양한 보고서**: 일일, 주간, 월간 맞춤형 보고서
- 💬 **Slack 통합**: 메시지 수집부터 DM 전송까지 완벽 통합
- 🔒 **보안 우선**: 환경 변수와 시크릿을 통한 안전한 키 관리

## 🚀 빠른 시작

### 1. 리포지토리 복제

```bash
git clone https://github.com/garimto81/slack-report-automation.git
cd slack-report-automation
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_CHANNEL_ID=C1234567890
SLACK_DM_USER_IDS=U1234567890,U9876543210

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google (선택사항)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DOC_ID=your-document-id
```

### 4. 로컬 실행

```bash
# TypeScript 컴파일
npm run build

# 일일 보고서 생성
npm run start -- --daily

# 주간 보고서 생성
npm run start -- --weekly

# 월간 보고서 생성
npm run start -- --monthly
```

## 📋 시스템 아키텍처

```mermaid
graph LR
    A[Slack Messages] --> B[Data Collection]
    B --> C[Gemini AI Analysis]
    C --> D[Report Generation]
    D --> E[Slack DM]
    D --> F[Supabase DB]
    
    G[GitHub Actions] --> B
    G --> |Schedule| H[Daily/Weekly/Monthly]
```

## 🏗️ 프로젝트 구조

```
slack-report-automation/
├── src/
│   ├── services/          # 핵심 서비스 모듈
│   │   ├── slack.service.ts      # Slack API 통합
│   │   ├── gemini.service.ts     # AI 분석 엔진
│   │   ├── supabase.service.ts   # 데이터베이스
│   │   └── report.service.ts     # 보고서 생성
│   ├── utils/            # 유틸리티 함수
│   └── types/            # TypeScript 타입
├── .github/workflows/    # GitHub Actions
│   ├── daily-report.yml
│   ├── weekly-report.yml
│   └── monthly-report.yml
└── docs/                 # 프로젝트 문서
```

## 🔧 GitHub Actions 설정

### 1. GitHub Secrets 추가

리포지토리 Settings → Secrets and variables → Actions에서 추가:

- `SLACK_BOT_TOKEN`
- `SLACK_CHANNEL_ID`
- `SLACK_DM_USER_IDS`
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (선택사항)
- `GOOGLE_DOC_ID` (선택사항)

### 2. 워크플로우 활성화

Actions 탭에서 워크플로우를 활성화하면 자동으로 실행됩니다:

- **일일 보고**: 매일 오전 10시 (한국시간)
- **주간 보고**: 매주 월요일 오전 10시
- **월간 보고**: 매월 첫째 주 월요일

## 📊 보고서 형식

### 일일 보고서
```
📊 오늘의 업무 요약 (2025.01.15)
━━━━━━━━━━━━━━━━━━━━━━━
🎯 최우선 업무: 클라이언트 A 프로젝트 마감
📝 진행 중: 5개 | 완료: 3개
👥 활동 인원: 12명
```

### 주간 보고서
```
📈 주간 업무 분석 (01.08 - 01.14)
━━━━━━━━━━━━━━━━━━━━━━━
✅ 주요 성과
• 프로젝트 X 완료 (100%)
• 신규 기능 3개 배포

🔄 진행 중인 업무
• [높음] 시스템 최적화 (진행률: 65%)
• [중간] 문서 업데이트 (진행률: 40%)
```

## 🛠️ 기술 스택

- **언어**: TypeScript, JavaScript
- **AI**: Google Gemini AI
- **데이터베이스**: Supabase (PostgreSQL)
- **메시징**: Slack API
- **자동화**: GitHub Actions
- **배포**: Vercel (선택사항)

## 📈 성능 및 효과

- ⏱️ **시간 절약**: 일일 30-45분 → 0분 (100% 자동화)
- 📊 **연간 효과**: 180시간 (22.5일) 절약
- 🎯 **정확성**: AI 기반 객관적 분석
- 💰 **ROI**: 3개월 만에 손익분기점 달성

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 관련 링크

- [프로젝트 문서](https://garimto81.github.io/slack-report-automation/)
- [이슈 트래커](https://github.com/garimto81/slack-report-automation/issues)
- [변경 로그](CHANGELOG.md)

## 👨‍💻 개발자

**Aiden Kim** - 프로젝트 리드

## 🙏 감사의 말

이 프로젝트는 카메라 파트 팀의 피드백과 지원으로 완성되었습니다.

---

<p align="center">
  Made with ❤️ by Camera Team
</p>