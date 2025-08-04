# 카메라 파트 업무 자동 보고 시스템 (Camera Part Work Auto-Report System)

[![Daily Camera Report](https://github.com/garimto81/ggp-report/actions/workflows/daily-report.yml/badge.svg)](https://github.com/garimto81/ggp-report/actions/workflows/daily-report.yml)

카메라 파트의 업무를 자동으로 수집, 분석하여 Google Docs에 보고하는 자동화 시스템입니다.

## 🚀 주요 기능

### 1. **데이터 수집**
- **Firebase Firestore**: `ggp-camera` 프로젝트에서 직접 카메라 파트 업무 정보 수집
- **GitHub Repository**: `garimto81/ggp-report` 리포지토리의 관련 활동 추적 (옵션)
- **성능 최적화**: 싱글톤 패턴과 5분 캐싱으로 빠른 데이터 수집

### 2. **AI 분석**
- **Gemini AI**: Google의 최신 AI 모델을 활용한 업무 우선순위 분석
- **스마트 선정**: 비즈니스 임팩트, 긴급도, 의존성을 고려하여 상위 3개 업무 자동 선정
- **선정 이유**: 각 업무가 선정된 이유를 명확히 제시

### 3. **자동 보고**
- **Google Docs 연동**: 지정된 문서에 자동으로 보고서 작성
- **구조화된 형식**: YYMMDD 형식의 날짜 탭에서 "카메라 Aiden Kim" 행 자동 업데이트
- **일일 자동 실행**: 매일 오전 10시(한국시간) 자동 실행
- **자동 재시도**: 실패 시 매시간 재시도 (최대 24회)

## 📋 시스템 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git
- GitHub Actions (자동 실행용)

## 🔧 설치 및 설정

### 1. 리포지토리 클론
```bash
git clone https://github.com/garimto81/ggp-report.git
cd ggp-report
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 입력:

```env
# Gemini AI API 키
GEMINI_API_KEY=your_gemini_api_key_here

# Google 서비스 계정 키 (JSON 형식)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'

# Google Docs 문서 ID
GOOGLE_DOC_ID=1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow
```

### 4. TypeScript 빌드
```bash
npm run build
```

## 🚀 실행 방법

### 1회 실행 (즉시 보고서 생성)
```bash
npm run report
```

### 스케줄러 모드 (매일 오전 10시 자동 실행)
```bash
npm start
```

### 개발 모드 (파일 변경 감지)
```bash
npm run dev
```

### 테스트 실행
```bash
# Firebase 연결 테스트
npm run test:firebase

# 전체 시스템 테스트
npm run test:system

# Google Docs V2 테스트
node test-docs-v2.js
```

## 📂 프로젝트 구조

```
ggp-report/
├── .github/
│   └── workflows/
│       ├── daily-report.yml     # 일일 자동 실행
│       ├── test-run.yml         # 수동 테스트
│       └── quick-test.yml       # 빠른 연결 테스트
├── src/
│   ├── config/                  # 설정 관리
│   │   └── index.ts
│   ├── services/                # 핵심 서비스
│   │   ├── firebaseDataFetcher.ts    # Firebase 데이터 수집
│   │   ├── githubDataFetcher.ts      # GitHub 데이터 수집
│   │   ├── geminiAnalyzer.ts         # AI 우선순위 분석
│   │   ├── googleDocsWriter.ts       # Google Docs 작성 (v1)
│   │   ├── googleDocsWriterV2.ts     # Google Docs 작성 (v2 - 현재 사용)
│   │   ├── reportGenerator.ts        # 리포트 생성 통합
│   │   └── scheduler.ts              # 스케줄링 관리
│   ├── types/                   # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/                   # 유틸리티 함수
│   │   └── dateUtils.ts
│   └── index.ts                 # 진입점
├── test-run.js                  # 테스트 실행 스크립트
├── firebase-test.js             # Firebase 연결 테스트
├── test-docs-v2.js              # Google Docs V2 테스트
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 API 키 및 인증 설정

### 1. Gemini AI API 키
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. API 키 생성
3. 환경 변수에 설정

### 2. Google Cloud 서비스 계정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. API 및 서비스 > 사용자 인증 정보로 이동
4. 서비스 계정 생성:
   - 이름: `ggp-report-writer`
   - 역할: 편집자
5. 키 생성 (JSON 형식)
6. Google Docs API 활성화
7. 대상 Google Docs 문서에서 서비스 계정 이메일에 편집 권한 부여

### 3. GitHub Actions Secrets 설정
1. GitHub 리포지토리의 Settings > Secrets and variables > Actions
2. 다음 시크릿 추가:
   - `GEMINI_API_KEY`: Gemini AI API 키
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON 전체 내용

## 📊 Google Docs 문서 구조

보고서가 작성될 Google Docs 문서는 다음 구조를 따라야 합니다:

1. **날짜 탭**: YYMMDD 형식 (예: 250804 = 2025년 8월 4일)
2. **표 구조**: 탭 내에 다음 열을 포함하는 표가 있어야 함
   - 파트 (첫 번째 열): "카메라 Aiden Kim" 포함
   - 진행 중인 업무 명칭
   - 핵심 내용(방향성)
   - 진행사항

예시:
```
250804 탭
┌─────────────────┬──────────────────┬─────────────────┬──────────┐
│ 파트            │ 진행 중인 업무   │ 핵심 내용      │ 진행사항 │
├─────────────────┼──────────────────┼─────────────────┼──────────┤
│ 카메라 Aiden Kim│ (자동 입력됨)    │ (자동 입력됨)   │ (자동)   │
└─────────────────┴──────────────────┴─────────────────┴──────────┘
```

## ⚡ 성능 최적화

- **싱글톤 패턴**: Firebase 인스턴스 재사용으로 인증 시간 단축
- **캐싱 시스템**: 5분간 데이터 캐시로 중복 요청 방지
- **병렬 처리**: Firebase와 GitHub 데이터 동시 수집
- **배치 업데이트**: Google Docs API 호출 최소화

## 🐛 문제 해결

### Firebase 연결 실패
```bash
# Firebase 연결 테스트
node firebase-test.js
```
- 익명 인증이 활성화되어 있는지 확인
- Firestore 보안 규칙 확인

### Google Docs 쓰기 실패
```bash
# Google Docs V2 테스트
node test-docs-v2.js
```
- 서비스 계정에 문서 편집 권한이 있는지 확인
- 날짜 탭이 존재하는지 확인
- "카메라 Aiden Kim" 행이 있는지 확인

### GitHub Actions 실행 실패
- Secrets 설정 확인
- 로그에서 상세 오류 메시지 확인

## 📈 모니터링

### GitHub Actions 대시보드
- [Daily Report 실행 기록](https://github.com/garimto81/ggp-report/actions/workflows/daily-report.yml)
- [Test Run 실행 기록](https://github.com/garimto81/ggp-report/actions/workflows/test-run.yml)

### 로컬 로그
```bash
# 실시간 로그 확인
npm run dev
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- Firebase Firestore를 통한 데이터 제공
- Google Gemini AI의 강력한 분석 기능
- Google Docs API의 문서 자동화 지원

## 📞 문의

문제가 발생하거나 질문이 있으신 경우:
- Issue 생성: [GitHub Issues](https://github.com/garimto81/ggp-report/issues)
- 이메일: garimto81@gmail.com

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>