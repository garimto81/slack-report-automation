# GitHub Actions 워크플로우 상세 가이드

## 📋 현재 구성된 워크플로우 목록

### 1. **Daily Camera Report** (`daily-report.yml`)
**목적**: 매일 자동으로 카메라 파트 업무 보고서 생성

#### 🕐 실행 시점
- **자동 실행**: 매일 오전 10시 (한국시간)
  - Cron: `0 1 * * *` (UTC 01:00 = KST 10:00)
- **수동 실행**: Actions 탭에서 "Run workflow" 버튼으로 언제든 실행 가능

#### 🔧 실행 단계
1. **코드 체크아웃**: 최신 코드를 GitHub에서 가져옴
2. **Node.js 환경 설정**: v18 설치, npm 캐시 활용
3. **의존성 설치**: `npm ci`로 정확한 버전 설치
4. **프로젝트 빌드**: TypeScript를 JavaScript로 컴파일
5. **보고서 생성**: 
   - Firebase에서 카메라 파트 업무 수집
   - GitHub에서 관련 활동 추적
   - Gemini AI로 우선순위 분석
   - Google Docs에 보고서 작성
6. **결과 보고**: 성공/실패 상태를 로그에 기록

#### 🔑 사용하는 Secrets
- `GEMINI_API_KEY`: AI 분석용
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google Docs 작성용
- `GOOGLE_DOC_ID`: 대상 문서 ID (선택사항)

---

### 2. **Retry Report on Failure** (`retry-on-failure.yml`)
**목적**: 일일 보고서 생성이 실패했을 때 자동으로 재시도

#### 🔄 실행 조건
- "Daily Camera Report" 워크플로우가 **실패**로 완료될 때만 실행
- 성공 시에는 실행되지 않음

#### ⏰ 재시도 로직
1. **1시간 대기**: 임시 장애가 해결될 시간을 줌
2. **자동 재실행**: GitHub API를 통해 Daily Report 워크플로우를 다시 트리거
3. **로그 기록**: 재시도 실행 로그 남김

#### 💡 장점
- 네트워크 오류, API 일시 장애 등으로 인한 실패 자동 복구
- 관리자 개입 없이 안정적인 서비스 운영
- 최대 24번까지 재시도 가능 (매시간 1회)

---

### 3. **Test Run** (`test-run.yml`)
**목적**: 시스템 설정과 동작을 검증하는 종합 테스트

#### 🧪 테스트 단계

##### **1단계: Firebase 연결 테스트**
```javascript
// Firebase 연결 상태 확인
const fetcher = new FirebaseDataFetcher();
const tasks = await fetcher.fetchCameraTasks();
console.log('Firebase 연결 성공: ' + tasks.length + '개 업무 발견');
```

##### **2단계: API 키 검증**
- **GEMINI_API_KEY**: 존재 여부 확인
- **GOOGLE_SERVICE_ACCOUNT_KEY**: 
  - 존재 여부 확인
  - JSON 형식 유효성 검증 (`jq` 사용)
  - 필수 필드(`client_email` 등) 포함 여부 확인

##### **3단계: 전체 시스템 테스트**
- 실제 보고서 생성 프로세스 실행
- 모든 컴포넌트 통합 테스트
- Google Docs에 테스트 보고서 작성

##### **4단계: 결과 보고**
- 성공 시: Google Docs 링크 제공
- 실패 시: 로그 확인 안내

#### 🎯 언제 사용하나요?
- **초기 설정 후**: API 키 설정이 올바른지 확인
- **문제 발생 시**: 어느 부분에서 오류가 나는지 진단
- **배포 전**: 시스템이 정상 작동하는지 검증

---

## 🚀 워크플로우 실행 방법

### 자동 실행
- **Daily Report**: 매일 오전 10시 자동 실행
- **Retry**: Daily Report 실패 시 자동 실행

### 수동 실행
1. GitHub 리포지토리 → **Actions** 탭
2. 실행할 워크플로우 선택
3. **"Run workflow"** 버튼 클릭
4. 브랜치 선택 (보통 main)
5. **"Run workflow"** 확인

## 📊 로그 확인 방법

### 실행 상태 확인
1. Actions 탭에서 워크플로우 실행 기록 확인
2. 각 실행을 클릭하여 상세 로그 확인
3. 실패한 단계를 클릭하여 오류 메시지 확인

### 일반적인 오류 패턴
- **Firebase 연결 실패**: 네트워크 문제 또는 프로젝트 설정 오류
- **API 키 오류**: Secrets 설정 문제
- **Google Docs 오류**: 서비스 계정 권한 문제

## ⚙️ 워크플로우 커스터마이징

### 실행 시간 변경
```yaml
# daily-report.yml에서
schedule:
  - cron: '0 2 * * *'  # 오전 11시로 변경 (UTC 02:00 = KST 11:00)
```

### 재시도 간격 변경
```yaml
# retry-on-failure.yml에서
- name: Wait before retry
  run: sleep 1800  # 30분으로 변경
```

### 알림 추가
```yaml
# 실패 시 슬랙 알림
- name: Notify failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔒 보안 고려사항

- **Secrets 관리**: API 키는 절대 코드에 노출되지 않음
- **권한 분리**: 각 서비스별 최소 필요 권한만 부여
- **로그 보안**: 민감한 정보는 로그에 출력되지 않도록 설정

## 🛠️ 문제 해결

### 워크플로우가 실행되지 않을 때
1. GitHub Actions가 활성화되어 있는지 확인
2. 시간대 설정 확인 (UTC vs KST)
3. 브랜치에 워크플로우 파일이 있는지 확인

### 권한 오류 발생 시
1. Secrets 설정 확인
2. Google 서비스 계정 권한 확인
3. Firebase 프로젝트 접근 권한 확인