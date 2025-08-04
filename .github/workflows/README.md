# GitHub Actions 워크플로우 가이드

## 🎯 카메라 파트 자동 보고 시스템

이 프로젝트는 카메라 파트의 업무를 자동으로 수집, 분석하여 Google Docs에 보고하는 시스템입니다.

## 📂 워크플로우 목록

### 1. daily-camera-report.yml (⭐ 메인 워크플로우)
- **목적**: 매일 오전 10시 카메라 파트 보고서 자동 생성
- **실행 시간**: 
  - 자동: 매일 KST 10:00 AM (UTC 01:00)
  - 수동: Actions 탭에서 "Run workflow" 클릭
- **동작 과정**:
  1. Firebase에서 카메라 파트 업무 수집
  2. Gemini AI로 우선순위 분석
  3. Google Docs에 보고서 작성
- **예상 소요 시간**: 5-7분

### 2. retry-camera-report.yml (자동 재시도)
- **목적**: daily-camera-report 실패 시 자동 재시도
- **실행**: 
  - 자동: daily-camera-report 실패 감지 시
  - 1시간 대기 후 재실행
- **최대 재시도**: 24회 (24시간)

## 🚀 사용 방법

### 1. 필수 설정 (GitHub Secrets)

Repository Settings → Secrets and variables → Actions에서 설정:

| Secret 이름 | 설명 | 예시 |
|------------|------|------|
| GEMINI_API_KEY | Google AI Studio에서 발급받은 API 키 | AIza... |
| GOOGLE_SERVICE_ACCOUNT_KEY | Google Cloud 서비스 계정 JSON 전체 | {"type":"service_account",...} |

### 2. 워크플로우 실행

#### 자동 실행
- 설정 완료 후 매일 오전 10시 자동 실행
- 실패 시 1시간마다 자동 재시도

#### 수동 실행
1. GitHub 리포지토리의 **Actions** 탭 이동
2. 왼쪽 메뉴에서 **Daily Camera Report** 선택
3. **Run workflow** 버튼 클릭
4. 브랜치 선택 (기본: main)
5. **Run workflow** 클릭

### 3. 실행 결과 확인

#### 성공 시
- ✅ 녹색 체크 표시
- Google Docs 문서에서 결과 확인: https://docs.google.com/document/d/1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow/
- 로그에서 상세 정보 확인

#### 실패 시
- ❌ 빨간색 X 표시
- 클릭하여 상세 로그 확인
- 자동으로 1시간 후 재시도

## 📊 Google Docs 문서 구조

보고서가 작성될 문서는 다음 구조를 따라야 합니다:

```
문서 ID: 1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow

탭 이름: YYMMDD (예: 250804 = 2025년 8월 4일)

표 구조:
┌─────────────────┬──────────────────┬─────────────────┬──────────┐
│ 파트            │ 진행 중인 업무   │ 핵심 내용      │ 진행사항 │
├─────────────────┼──────────────────┼─────────────────┼──────────┤
│ 카메라 Aiden Kim│ (자동 입력)      │ (자동 입력)     │ (자동)   │
└─────────────────┴──────────────────┴─────────────────┴──────────┘
```

## 🐛 문제 해결

### 1. 워크플로우가 실행되지 않음
- Actions가 활성화되어 있는지 확인
- 기본 브랜치가 main인지 확인
- cron 표현식이 올바른지 확인

### 2. Firebase 연결 실패
- Firebase 프로젝트 'ggp-camera' 설정 확인
- 익명 인증 활성화 여부 확인
- Firestore 보안 규칙 확인

### 3. Google Docs 쓰기 실패
- 서비스 계정 이메일에 문서 편집 권한 부여
- 날짜 탭(YYMMDD) 존재 확인
- "카메라 Aiden Kim" 행이 있는 표 확인

### 4. API 키 오류
- Secrets에 올바른 값 설정 확인
- JSON 형식 유효성 확인 (서비스 계정 키)
- API 키에 불필요한 공백이나 줄바꿈 없는지 확인

## 📈 모니터링

### 실행 기록 확인
1. Actions 탭에서 **Daily Camera Report** 선택
2. 실행 기록 목록에서 특정 실행 클릭
3. 각 단계별 로그 확인

### 실행 통계
- 평균 실행 시간: 5-7분
- 매일 오전 10시 정기 실행
- 실패 시 최대 24회 재시도

## 💡 팁

1. **로그 확인**: 실패 시 상세 로그에서 구체적인 오류 메시지 확인
2. **시간대 주의**: 모든 시간은 KST 기준 (UTC+9)
3. **문서 준비**: Google Docs에 미리 날짜 탭과 표 구조 생성
4. **테스트**: 수동 실행으로 먼저 테스트 후 자동 실행 활용

## 🔒 보안 주의사항

- API 키를 코드에 직접 포함하지 마세요
- Secrets는 절대 로그에 출력하지 마세요
- 서비스 계정 키는 최소 권한 원칙 적용

---

문제가 발생하면 [Issues](https://github.com/garimto81/ggp-report/issues)에 등록해주세요.