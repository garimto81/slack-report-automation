# GitHub Actions 자동 보고서 실행 가이드

## 사전 준비

### 1. GitHub 저장소 생성
1. GitHub.com에서 새 저장소 생성 (예: `slack-report-automation`)
2. Public 또는 Private 선택

### 2. 코드 푸시
```bash
# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/slack-report-automation.git

# 코드 푸시
git push -u origin main
```

### 3. GitHub Secrets 설정
저장소 Settings → Secrets and variables → Actions에서 추가:

- `SLACK_BOT_TOKEN`: Slack 봇 토큰 (xoxb-로 시작)
- `SLACK_CHANNEL_ID`: 분석할 채널 ID
- `SLACK_DM_USER_ID`: U080BA70DC4 (보고서 받을 사용자)
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase anon key
- `GEMINI_API_KEY`: Google Gemini API 키

## 자동 실행 방법

### 방법 1: 수동 트리거 (즉시 테스트)
1. GitHub 저장소에서 **Actions** 탭 클릭
2. 좌측에서 **"Slack Reports"** 워크플로우 선택
3. **"Run workflow"** 버튼 클릭
4. 보고서 타입 선택:
   - `daily` - 일일 보고서
   - `weekly` - 주간 보고서
   - `monthly` - 월간 보고서
5. **"Run workflow"** 클릭

### 방법 2: 자동 스케줄
현재 설정된 스케줄 (UTC 기준):
- **일일**: 매일 오전 9시 UTC (한국시간 오후 6시)
- **주간**: 매주 월요일 오전 9시 UTC
- **월간**: 매월 1일 오전 9시 UTC

### 방법 3: API로 트리거
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/slack-report-automation/actions/workflows/reports.yml/dispatches \
  -d '{"ref":"main","inputs":{"report_type":"daily"}}'
```

## 실행 확인

1. Actions 탭에서 실행 상태 확인
2. 워크플로우 클릭하여 로그 확인
3. Slack DM에서 보고서 수신 확인

## 스케줄 변경

`.github/workflows/reports.yml` 파일 수정:

```yaml
schedule:
  # 한국시간 기준 예시
  - cron: '0 0 * * *'  # 매일 오전 9시 (KST)
  - cron: '0 0 * * 1'  # 매주 월요일 오전 9시 (KST)
  - cron: '0 0 1 * *'  # 매월 1일 오전 9시 (KST)
```

## 문제 해결

### 실행 실패 시
1. Actions 로그에서 오류 메시지 확인
2. Secrets가 올바르게 설정되었는지 확인
3. Slack 봇 권한 확인