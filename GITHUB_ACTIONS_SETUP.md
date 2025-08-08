# 🚀 GitHub Actions 자동화 설정 가이드

## ⭐️ **2025-08-08 최신 업데이트: 워크플로우 최적화 완료**
- **5개 → 2개 워크플로우로 통합** (60% 감소)
- **중복 알림 문제 완전 해결** (5회 → 1회)
- **시스템 안정성 대폭 향상**

## 📋 Required Secrets

GitHub Repository Settings → Secrets and variables → Actions에 다음 시크릿을 추가해야 합니다:

### 1. SLACK_BOT_TOKEN
- **값**: `xoxb-`로 시작하는 Slack Bot Token
- **획득 방법**: 
  1. https://api.slack.com/apps 접속
  2. 앱 선택 → OAuth & Permissions
  3. Bot User OAuth Token 복사
- **필요 권한**:
  - `channels:history`
  - `channels:read`
  - `chat:write`
  - `im:write`
  - `users:read`

### 2. SLACK_CHANNEL_ID
- **값**: `C`로 시작하는 채널 ID (예: `C0875HJ79NW`)
- **획득 방법**:
  1. Slack에서 채널 우클릭
  2. View channel details
  3. 하단의 Channel ID 복사

### 3. SLACK_DM_USER_IDS
- **값**: 쉼표로 구분된 사용자 ID 목록
- **예시**: `U05MYPN16Q3,U040EUZ6JRY,U080BA70DC4,U05QNJWPFBJ,U040HCT21CL`
- **획득 방법**:
  1. Slack에서 사용자 프로필 클릭
  2. More → Copy member ID

### 4. GEMINI_API_KEY
- **값**: Google Gemini API Key
- **획득 방법**:
  1. https://makersuite.google.com/app/apikey 접속
  2. Create API Key
  3. 생성된 키 복사

## 🔧 최적화된 워크플로우 설정

### 현재 활성 워크플로우 (2개)

#### 1. 📊 Daily Slack Report (`daily-slack-report.yml`)
```yaml
# 평일 오전 9시 (KST) - 월-금요일만 실행
- cron: '0 0 * * 1-5'  # UTC 0:00 = KST 9:00
```
- **기능**: 우선순위 기반 보고서 생성 (월간 > 주간 > 일간)
- **범위**: 평일 전용 (주말 실행 안함)
- **특징**: 워크데이 체크, 수동 실행 지원

#### 2. 📷 Camera Auto Update (`camera-auto-update.yml`)
```yaml
# 평일 오전 10시 (KST) - 월-금요일만 실행  
- cron: '0 1 * * 1-5'  # UTC 1:00 = KST 10:00
```
- **기능**: Google Docs 카메라 파트 자동 업데이트
- **범위**: 상위 3개 우선순위 업무 선별
- **특징**: 문서 실시간 업데이트

### 수동 실행 방법
#### Daily Slack Report 수동 실행
1. GitHub Repository → Actions 탭
2. "Daily Slack Report" 워크플로우 선택
3. Run workflow 버튼 클릭
4. Report type 선택:
   - `auto`: 자동 판단 (월간 > 주간 > 일간)
   - `daily`: 강제 일간
   - `weekly`: 강제 주간  
   - `monthly`: 강제 월간
5. Run workflow 실행

#### Camera Auto Update 수동 실행
1. "Camera Part Auto Update" 워크플로우 선택
2. Run workflow 버튼 클릭
3. Force run 체크 (시간/요일 제한 무시)
4. Run workflow 실행

## 📊 최적화된 워크플로우 기능

### 1. 📊 Daily Slack Report 워크플로우
#### 핵심 기능
- **평일 전용 실행**: 월-금 오전 9시 (주말 자동 스킵)
- **우선순위 기반 보고서**: 날짜에 따라 자동 선택
  - 매월 1일 → 월간 보고서 (30일 범위)
  - 매주 월요일 → 주간 보고서 (7일 범위)  
  - 기타 평일 → 일간 보고서 (24시간 범위)
- **업무 그룹화**: 동일 목적 업무 자동 통합 (60-74% 압축)
- **Slack DM 전송**: 팀원 5명에게 동시 전송

#### 실행 모드
- **자동 모드**: 스케줄 실행 (평일 9AM)
- **수동 모드**: 워크플로우 디스패치
- **테스트 모드**: Push 이벤트 시 (실제 전송 없음)

### 2. 📷 Camera Auto Update 워크플로우  
#### 핵심 기능
- **Google Docs 연동**: 카메라 파트 실시간 업데이트
- **날짜 탭 자동 선택**: YYMMDD 형식 탭 탐지
- **우선순위 선별**: AI 기반 상위 3개 업무 선택
- **안전한 업데이트**: 검증 실패 시 자동 중단

#### 실행 조건
- **평일 10시 실행**: 월-금 오전 10시 (9시 이후 실행으로 충돌 방지)
- **강제 실행 옵션**: 수동 실행 시 시간/요일 제한 무시

### 🚫 제거된 기능 (중복 방지)
- ~~중복된 일간 보고서 워크플로우~~
- ~~별도의 주간/월간 전용 워크플로우~~  
- ~~테스트 전용 워크플로우~~
- **결과**: 5개 → 2개 워크플로우로 단순화

## 🎯 그룹화 시스템 특징

### 자동 통합 규칙
- 동일 목적/프로젝트 업무 자동 통합
- 세부 작업 괄호 표시: `(카메라/SD녹화/오디오)`
- 평균 압축률: 60-74%

### 표시 예시
```
★ 포커 시연회 준비 작업 (카메라/SD녹화/오디오)
★ 프라하 촬영 장비 운송 최적화 (장비운송/포장/R&D)
- 원격 프로덕션 기술 지원 (영상싱크/타임코드)
```

## 🔍 모니터링

### 실행 로그 확인
1. Actions 탭 → 워크플로우 선택
2. 실행 기록 클릭
3. 각 Job의 로그 확인

### 실패 시 알림
- Repository Settings → Notifications
- GitHub Actions 실패 알림 설정

## 🐛 문제 해결

### ⭐️ 해결된 주요 문제
#### 워크플로우 중복 실행 (완전 해결)
```
문제: 5개 워크플로우 동시 실행 → Slack 알림 5회 중복
해결: 2개 워크플로우로 통합 → 중복 알림 100% 제거
```

### 일반적인 오류와 해결법

#### 1. SLACK_BOT_TOKEN 오류
```
Error: missing_scope
```
**해결**: Slack App의 OAuth 권한 재설정

#### 2. GEMINI_API_KEY 오류
```
Error: API key not valid
```
**해결**: API 키 재생성 및 업데이트

#### 3. Google Docs 업데이트 실패
```
Error: The caller does not have permission
```
**해결**: 서비스 계정에 Google Docs 편집 권한 부여

#### 4. 스케줄 실행 안됨
- GitHub Actions가 60일간 활동이 없으면 자동 비활성화
- Repository에 커밋을 하거나 수동으로 워크플로우 실행

#### 5. 워크플로우 충돌 (해결됨)
- **기존 문제**: 여러 워크플로우가 동시 실행
- **현재 상태**: 시간 분리 (9시/10시) + 워크플로우 통합으로 완전 해결

## 📚 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Cron 표현식 생성기](https://crontab.guru/)
- [Slack API 문서](https://api.slack.com/)
- [Google Gemini API](https://ai.google.dev/)

---

마지막 업데이트: 2025-08-08 (워크플로우 최적화 완료)