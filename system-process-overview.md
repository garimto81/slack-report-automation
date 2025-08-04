# 카메라 파트 업무 자동 보고 시스템 - 전체 프로세스

## 🏗️ 시스템 아키텍처 개요

```
[Firebase] ←→ [GitHub Actions] ←→ [Gemini AI] ←→ [Google Docs]
    ↓              ↓                 ↓              ↓
 업무 데이터    자동 실행 환경    우선순위 분석   최종 보고서
```

## 📋 전체 프로세스 플로우

### 1단계: 자동 트리거 (매일 오전 10시)
```
GitHub Actions 스케줄러
       ↓
Daily Camera Report 워크플로우 실행
       ↓
Ubuntu 컨테이너 생성 및 환경 설정
```

### 2단계: 환경 구성 (2-3분)
```
✅ 코드 체크아웃 (GitHub에서 최신 코드 다운로드)
✅ Node.js v18 설치 및 설정
✅ npm 의존성 설치 (Firebase, Gemini AI, Google APIs)
✅ TypeScript → JavaScript 빌드
```

### 3단계: 데이터 수집 (1-2분)
```
🔥 Firebase Firestore 연결
   ├── 익명 인증 (1초)
   ├── 'tasks' 컬렉션 조회
   ├── Aiden Kim 할당 업무 필터링 (23개)
   └── 캐시 저장 (5분간 유효)

🐙 GitHub Repository 접근
   ├── garimto81/ggp-report 연결 시도
   ├── 이슈 및 커밋 내역 조회
   └── 카메라 관련 활동 필터링
```

### 4단계: AI 우선순위 분석 (1-2분)
```
🤖 Gemini AI 분석 엔진
   ├── 수집된 업무 데이터 전송
   ├── 비즈니스 임팩트 분석
   ├── 긴급도 및 의존성 평가
   ├── 진행 상황 고려
   └── 상위 3개 업무 선정 + 선정 이유
```

### 5단계: 보고서 생성 및 작성 (1-2분)
```
📝 Google Docs API 연동
   ├── 서비스 계정으로 인증
   ├── 대상 문서 접근
   ├── 오늘 날짜 섹션 확인/생성
   ├── '카메라 Aiden Kim' 항목 찾기
   └── 우선순위 업무 3개 자동 입력
```

## 🔄 데이터 흐름 상세

### A. Firebase → 시스템
```json
{
  "id": "업무ID",
  "title": "업무명",
  "assignees": ["Aiden Kim"],
  "status": "pending|in-progress|completed",
  "progress": 85,
  "category": "교육|운영 안정화|시장 분석",
  "priority": "high|medium|low",
  "startDate": "2025-08-01",
  "endDate": "2025-08-15",
  "description": "업무 설명 또는 URL"
}
```

### B. 시스템 → Gemini AI
```
프롬프트: "다음 23개 업무 중 가장 우선순위가 높은 3개를 선정하고 이유를 설명해주세요"
응답: "2 | 95 | 고객 납품 관련 업무로 긴급도가 매우 높음"
```

### C. 시스템 → Google Docs
```
=== 2025.08.04 카메라 파트 업무 보고 ===

담당자: 카메라 Aiden Kim

1. 진행 중인 업무 명칭: AI 쇼츠 자동 제작 앱
   핵심 내용(방향성): 고객 납품 관련 업무로 긴급도가 매우 높음
   진행사항: 0%

2. 진행 중인 업무 명칭: 아카이브 MAM GGP 버전
   핵심 내용(방향성): 시스템 안정화를 위한 핵심 업무
   진행사항: 10%

3. 진행 중인 업무 명칭: 포커 트렌드 분석기
   핵심 내용(방향성): 시장 분석을 통한 전략 수립 필요
   진행사항: 0%

보고 시간: 오전 10:15:23
```

## ⚡ 성능 최적화 메커니즘

### 싱글톤 패턴
```typescript
// Firebase 인스턴스 재사용
const fetcher = FirebaseDataFetcher.getInstance();
// ✅ 첫 번째 호출: 인증 수행
// ✅ 이후 호출: 인증 생략
```

### 캐싱 시스템
```typescript
// 5분간 데이터 캐시
if (cachedData && withinCacheTime) {
  return cachedData; // 즉시 반환
}
```

### 병렬 처리
```typescript
// Firebase와 GitHub 동시 수집
const [firebaseTasks, githubTasks] = await Promise.all([
  fetchFirebase(),
  fetchGitHub()
]);
```

## 🛡️ 에러 처리 및 복구

### 자동 재시도 메커니즘
```
Daily Report 실패
       ↓
Retry Workflow 자동 트리거
       ↓
1시간 대기 후 재실행
       ↓
최대 24회 재시도 (24시간)
```

### 부분 실패 처리
```
Firebase 성공 + GitHub 실패 → Firebase 데이터만으로 진행
Gemini AI 실패 → 기본 우선순위 로직 사용
Google Docs 실패 → 로그에 결과 저장
```

## 🔧 구성 요소별 역할

### 1. FirebaseDataFetcher
- **역할**: Firestore에서 카메라 파트 업무 수집
- **최적화**: 싱글톤 + 캐싱 + 익명 인증
- **출력**: Task[] 배열 (23개 업무)

### 2. GitHubDataFetcher  
- **역할**: GitHub에서 관련 활동 추적
- **처리**: 이슈, 커밋, PR 분석
- **출력**: 카메라 관련 활동 목록

### 3. GeminiAnalyzer
- **역할**: AI 기반 우선순위 분석
- **알고리즘**: 비즈니스 임팩트 + 긴급도 + 의존성
- **출력**: 상위 3개 업무 + 선정 이유

### 4. GoogleDocsWriter
- **역할**: 구조화된 보고서 작성
- **기능**: 날짜별 섹션 관리 + 템플릿 적용
- **출력**: 완성된 일일 보고서

### 5. ReportGenerator
- **역할**: 전체 프로세스 오케스트레이션
- **기능**: 에러 처리 + 로깅 + 성능 모니터링

## 📊 실행 결과 예시

### 성공적인 실행 로그
```
[10:00:01] Starting report generation...
[10:00:02] 1. Fetching tasks from Firebase and GitHub in parallel...
[10:00:02] Firebase auth completed in 1011ms
[10:00:03] Firebase: 23 tasks, GitHub: 0 tasks
[10:00:03] Found 23 total camera tasks
[10:00:04] 2. Analyzing task priorities with Gemini AI...
[10:00:06] 3. Writing report to Google Docs...
[10:00:07] Writing report for date: 2025.08.04
[10:00:08] Report generated successfully!
```

### 실행 시간 분석
| 단계 | 시간 | 누적 |
|------|------|------|
| 환경 설정 | 2-3분 | 3분 |
| 데이터 수집 | 1-2분 | 5분 |
| AI 분석 | 1-2분 | 7분 |
| 문서 작성 | 1분 | 8분 |
| **총합** | **6-8분** | |

## 🎯 비즈니스 가치

### 자동화 효과
- **수동 작업 시간**: 30-45분/일 → **자동화**: 0분
- **일관성**: 매일 정시 실행으로 누락 방지
- **정확성**: AI 분석으로 객관적 우선순위 판단
- **추적성**: 모든 실행 로그 GitHub Actions에 저장

### 확장 가능성
- **다른 파트 적용**: 설정만 변경하면 다른 담당자도 사용 가능
- **보고서 형식 커스터마이징**: 템플릿 수정으로 다양한 형식 지원
- **알림 추가**: Slack, 이메일 등 추가 알림 채널 연동 가능