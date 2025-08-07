# 🚀 GitHub Actions 자동화 설정 가이드

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

## 🔧 워크플로우 설정

### 자동 실행 스케줄 (한국 시간 기준)
```yaml
# 일간 보고서 - 매일 오전 9시
- cron: '0 0 * * *'

# 주간 보고서 - 매주 월요일 오전 9시  
- cron: '0 0 * * 1'

# 월간 보고서 - 매월 1일 오전 9시
- cron: '0 0 1 * *'
```

### 수동 실행 방법
1. GitHub Repository → Actions 탭
2. "Automated Slack Reports" 워크플로우 선택
3. Run workflow 버튼 클릭
4. Report type 선택 (daily/weekly/monthly)
5. Run workflow 실행

## 📊 워크플로우 기능

### 1. Daily Report Job
- 매일 자동 실행
- 최근 24시간 메시지 분석
- 카메라 파트 업무 추출 및 그룹화
- 5명의 팀원에게 DM 전송

### 2. Weekly Report Job
- 매주 월요일 자동 실행
- 최근 7일간 메시지 분석
- 업무 그룹화로 60-70% 압축
- 주간 성과 요약

### 3. Monthly Report Job
- 매월 1일 자동 실행
- 최근 30일간 메시지 분석
- 최대 74% 업무 압축
- 월간 종합 보고서

### 4. Test Report Job
- PR/Push 시 자동 실행
- 그룹화 로직 테스트
- 실제 전송 없이 검증만 수행

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

#### 3. 스케줄 실행 안됨
- GitHub Actions가 60일간 활동이 없으면 자동 비활성화
- Repository에 커밋을 하거나 수동으로 워크플로우 실행

## 📚 참고 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Cron 표현식 생성기](https://crontab.guru/)
- [Slack API 문서](https://api.slack.com/)
- [Google Gemini API](https://ai.google.dev/)

---

마지막 업데이트: 2025-08-07