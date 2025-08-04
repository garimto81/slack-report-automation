# 카메라 파트 업무 자동 보고 시스템

카메라 파트의 업무를 자동으로 수집, 분석하여 Google Docs에 보고하는 자동화 시스템입니다.

## 주요 기능

1. **데이터 수집**
   - Firebase Firestore에서 직접 카메라 파트 업무 정보 수집
   - https://github.com/garimto81/slack-report-automation 리포지토리에서 관련 활동 추적

2. **AI 분석**
   - Gemini AI를 활용한 업무 우선순위 분석
   - 가장 중요한 3개 업무 자동 선정

3. **자동 보고**
   - Google Docs 문서에 자동 입력
   - 매일 오전 10시 자동 실행
   - 실패 시 매시간 재시도

## 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 `.env`로 복사하고 필요한 값들을 입력:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_DOC_ID=1DuwfBuYRi5PH3tpGfme8_p3yqU1LdNve-842K2KOvQo
```

### 3. TypeScript 빌드
```bash
npm run build
```

## 실행 방법

### 스케줄러 모드 (기본)
```bash
npm start
```

### 1회 실행 모드
```bash
npm start -- --run-once
```

### 개발 모드
```bash
npm run dev
```

## 프로젝트 구조

```
src/
├── config/          # 설정 관리
├── services/        # 핵심 서비스
│   ├── firebaseDataFetcher.ts   # Firebase 데이터 수집
│   ├── githubDataFetcher.ts     # GitHub 데이터 수집
│   ├── geminiAnalyzer.ts        # AI 분석
│   ├── googleDocsWriter.ts      # Google Docs 작성
│   ├── reportGenerator.ts       # 리포트 생성 통합
│   └── scheduler.ts             # 스케줄링 관리
├── types/           # TypeScript 타입 정의
├── utils/           # 유틸리티 함수
└── index.ts         # 진입점
```

## Google 인증 설정

1. Google Cloud Console에서 서비스 계정 생성
2. Google Docs API 활성화
3. 서비스 계정에 문서 편집 권한 부여
4. 서비스 계정 키를 JSON으로 다운로드
5. 환경 변수에 설정

## 주의사항

- Firebase 프로젝트 'ggp-camera'에 접근 가능해야 함
- Google Docs 문서에 편집 권한이 있어야 함
- 한국 시간(Asia/Seoul) 기준으로 작동
- Aiden Kim으로 할당된 업무만 수집됨