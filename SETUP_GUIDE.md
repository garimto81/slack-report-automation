# 설정 가이드

## 1. Slack 설정

### Slack 앱 생성
1. [api.slack.com/apps](https://api.slack.com/apps) 접속
2. "Create New App" → "From scratch" 선택
3. 앱 이름과 워크스페이스 선택

### Bot Token 권한 설정
1. 좌측 메뉴 "OAuth & Permissions" 클릭
2. "Scopes" → "Bot Token Scopes"에 다음 권한 추가:
   - `channels:history` - 공개 채널 메시지 읽기
   - `groups:history` - 비공개 채널 메시지 읽기 (필요시)
   - `chat:write` - 메시지 전송
   - `im:write` - DM 전송

3. 상단 "Install to Workspace" 클릭
4. "Bot User OAuth Token" 복사 (xoxb-로 시작)

### 채널 ID 찾기
1. 슬랙 앱에서 분석할 채널 우클릭
2. "View channel details" 클릭
3. 하단 "Channel ID" 복사

### 사용자 ID 찾기
1. 보고서 받을 사용자 프로필 클릭
2. "View full profile" 클릭
3. "More" → "Copy member ID" 클릭

## 2. Supabase 설정

### 프로젝트 생성
1. [supabase.com](https://supabase.com) 로그인
2. "New project" 클릭
3. 프로젝트 정보 입력

### 테이블 생성
1. SQL Editor 열기
2. `supabase/migrations/001_create_reports_table.sql` 내용 실행

### API 키 복사
1. Settings → API
2. "Project URL" 복사
3. "anon public" 키 복사

## 3. Gemini AI 설정

### API Key 발급
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. 생성된 API Key 복사

## 4. GitHub 설정

### Secrets 추가
1. GitHub 저장소 → Settings
2. Secrets and variables → Actions
3. 다음 시크릿 추가:

| Secret 이름 | 값 | 예시 |
|------------|-----|-----|
| SLACK_BOT_TOKEN | Bot User OAuth Token | xoxb-123456789... |
| SLACK_CHANNEL_ID | 채널 ID | C1234567890 |
| SLACK_DM_USER_ID | 사용자 ID | U1234567890 |
| SUPABASE_URL | Project URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | anon key | eyJhbGci... |
| GEMINI_API_KEY | Gemini API Key | AIzaSy... |

### Actions 활성화
1. Actions 탭에서 워크플로우 확인
2. 필요시 "Enable workflows" 클릭

## 5. 시간대 설정

GitHub Actions는 UTC 시간 기준으로 실행됩니다.

한국 시간 기준 예시:
- 한국 오전 9시 = UTC 0시 → cron: `0 0 * * *`
- 한국 오후 6시 = UTC 9시 → cron: `0 9 * * *`

`.github/workflows/reports.yml` 파일에서 시간 수정 가능:

```yaml
schedule:
  - cron: '0 0 * * *'  # 매일 한국시간 오전 9시
```

## 6. 테스트

### 수동 실행
1. GitHub Actions 탭
2. "Slack Reports" 워크플로우 선택
3. "Run workflow" 클릭
4. 보고서 타입 선택 후 실행

### 로컬 테스트
```bash
# .env 파일 생성
cp .env.example .env
# 편집기로 .env 파일에 실제 값 입력

# 테스트 실행
npm install
npm run build
node dist/generate-report.js --type daily
```