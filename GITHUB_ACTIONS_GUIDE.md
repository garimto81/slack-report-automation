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
- `SLACK_DM_USER_IDS`: U080BA70DC4,U1234567890 (보고서 받을 사용자들, 쉼표로 구분)
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase anon key
- `GEMINI_API_KEY`: Google Gemini API 키

## 자동 실행 방법

### 방법 1: 수동 트리거 (즉시 테스트)

#### 상세 실행 단계
1. GitHub 저장소에서 **Actions** 탭 클릭
   - URL: https://github.com/garimto81/slack-report-automation/actions

2. 좌측에서 **"Slack Reports"** 워크플로우 선택
   - 워크플로우 목록에서 찾아 클릭

3. **"Run workflow"** 버튼 클릭
   - 페이지 오른쪽 상단의 회색 버튼

4. 드롭다운 옵션 설정:
   - **Branch**: `main` (기본값 유지)
   - **Report type**: 
     - `daily` - 일일 보고서 (최근 24시간)
     - `weekly` - 주간 보고서 (최근 7일)
     - `monthly` - 월간 보고서 (최근 30일)

5. 녹색 **"Run workflow"** 버튼 클릭하여 실행

#### 실행 모니터링
- 🟠 주황색 원: 실행 중
- ✅ 녹색 체크: 성공
- ❌ 빨간색 X: 실패

클릭하여 실시간 로그 확인 가능

### 방법 2: 자동 스케줄
현재 설정된 스케줄 (UTC 기준):
- **일일**: 평일(월-금) 오전 1시 UTC (한국시간 오전 10시)
- **주간**: 수동 실행만 지원
- **월간**: 수동 실행만 지원

### 방법 3: API로 트리거
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_USERNAME/slack-report-automation/actions/workflows/reports.yml/dispatches \
  -d '{"ref":"main","inputs":{"report_type":"daily"}}'
```

## 실행 확인

### 실행 단계별 체크리스트
1. **Actions 탭에서 실행 상태 확인**
   - 워크플로우 이름 옆의 상태 아이콘 확인
   - 예상 소요 시간: 1-3분 (쓰레드 포함 시 더 길어질 수 있음)

2. **워크플로우 클릭하여 상세 로그 확인**
   - ✅ Checkout - 코드 체크아웃
   - ✅ Setup Node.js - Node.js 환경 설정
   - ✅ Install dependencies - 패키지 설치
   - ✅ Build project - TypeScript 빌드
   - ✅ Generate report - 보고서 생성 및 전송

3. **Slack DM에서 보고서 수신 확인**
   - SLACK_DM_USER_IDS에 설정된 모든 사용자 확인
   - 보고서 형식 및 내용 검증

### 일일 보고서 예시
```
*일일 업무 보고*

• 카메라 렌즈 청소 및 점검 완료
• 신제품 촬영을 위한 조명 세팅 진행
• 드론 배터리 교체 및 테스트 비행 완료
```

## 스케줄 변경

`.github/workflows/reports.yml` 파일 수정:

```yaml
schedule:
  # 한국시간 기준 예시
  - cron: '0 1 * * 1-5'  # 평일(월-금) 오전 10시 (KST)
  # 주간/월간 보고서는 수동 실행 권장
```

## 문제 해결

### 실행 실패 시
1. Actions 로그에서 오류 메시지 확인
2. Secrets가 올바르게 설정되었는지 확인
3. Slack 봇 권한 확인