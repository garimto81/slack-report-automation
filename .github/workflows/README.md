# GitHub Actions 워크플로우 가이드

## 🎯 카메라 파트 자동 보고 시스템 워크플로우

### 1. daily-camera-report.yml (✅ 사용)
- **목적**: 매일 오전 10시 카메라 파트 보고서 자동 생성
- **실행**: 
  - 자동: 매일 KST 10:00 AM
  - 수동: Actions 탭에서 수동 실행 가능
- **기능**: Firebase → Gemini AI → Google Docs 자동 보고

### 2. retry-camera-report.yml (✅ 사용)
- **목적**: daily-camera-report 실패 시 자동 재시도
- **실행**: 자동으로 실패 감지 후 1시간 대기 후 재시도
- **기능**: 최대 24회 재시도 (24시간)

### 3. test-run.yml (✅ 사용)
- **목적**: 전체 시스템 테스트
- **실행**: 수동 실행 전용
- **기능**: Firebase, Gemini, Google Docs 전체 연동 테스트

### 4. quick-test.yml (✅ 사용)
- **목적**: 빠른 연결 테스트 (3분 이내)
- **실행**: 수동 실행 전용
- **기능**: Firebase 연결, API 키 검증

## ⚠️ 사용하지 않는 워크플로우 (Slack 시스템용)

### ❌ daily-report.yml
- Slack/Supabase 시스템용 (카메라 시스템과 무관)
- **대신 사용**: daily-camera-report.yml

### ❌ weekly-report.yml
- Slack 주간 보고서용

### ❌ monthly-report.yml  
- Slack 월간 보고서용

### ❌ monthly-weekly-report.yml
- Slack 복합 보고서용

### ❌ retry-on-failure.yml
- Slack 시스템 재시도용
- **대신 사용**: retry-camera-report.yml

## 🚀 사용 방법

### 1. 일일 자동 보고서 활성화
```yaml
# daily-camera-report.yml이 자동으로 매일 오전 10시 실행됩니다
# GitHub Secrets 설정 필요:
# - GEMINI_API_KEY
# - GOOGLE_SERVICE_ACCOUNT_KEY
```

### 2. 수동 테스트 실행
1. GitHub 리포지토리의 Actions 탭 이동
2. 왼쪽 메뉴에서 워크플로우 선택:
   - `Quick Test`: 빠른 연결 확인
   - `Test Run`: 전체 시스템 테스트
3. "Run workflow" 버튼 클릭

### 3. 실행 결과 확인
- Actions 탭에서 실행 기록 확인
- 성공 시 Google Docs 문서에서 결과 확인
- 실패 시 로그 확인 후 문제 해결

## 📝 주의사항

1. **GitHub Secrets 설정 필수**
   - Repository Settings → Secrets and variables → Actions
   - GEMINI_API_KEY, GOOGLE_SERVICE_ACCOUNT_KEY 추가

2. **Google Docs 문서 구조**
   - YYMMDD 형식의 탭 필요 (예: 250804)
   - "카메라 Aiden Kim" 행이 있는 표 필요

3. **타임존**
   - 모든 시간은 한국 시간(KST) 기준
   - UTC로 설정되어 있으나 내부적으로 KST 변환

## 🔧 문제 해결

### 워크플로우 실행 안 됨
1. Actions가 활성화되어 있는지 확인
2. 기본 브랜치가 main인지 확인
3. workflow 파일이 .github/workflows/에 있는지 확인

### API 키 오류
1. Secrets에 올바른 값이 설정되어 있는지 확인
2. JSON 형식이 올바른지 확인 (GOOGLE_SERVICE_ACCOUNT_KEY)

### 문서 쓰기 실패
1. 서비스 계정에 문서 편집 권한이 있는지 확인
2. 날짜 탭과 표 구조가 올바른지 확인