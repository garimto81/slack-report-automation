# 온라인 자동 실행 배포 가이드

## GitHub Actions를 통한 자동 실행 (권장)

### 1. GitHub 리포지토리 생성
```bash
# 새 리포지토리 생성
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/camera-auto-report.git
git push -u origin main
```

### 2. GitHub Secrets 설정
리포지토리 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

- `GEMINI_API_KEY`: Gemini AI API 키
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google 서비스 계정 JSON (전체 내용)
- `GOOGLE_DOC_ID`: Google Docs 문서 ID (선택사항, 기본값 사용 가능)

### 3. 워크플로우 활성화
- Actions 탭에서 워크플로우 활성화
- 매일 오전 10시(한국시간) 자동 실행
- 실패 시 1시간 후 자동 재시도

### 4. 수동 실행 테스트
Actions > Daily Camera Report > Run workflow 클릭

## 대체 배포 옵션

### 옵션 1: Vercel + Cron-job.org
```javascript
// api/report.js
export default async function handler(req, res) {
  if (req.headers.authorization !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // 리포트 생성 로직
  const generator = new ReportGenerator();
  const success = await generator.generateReport();
  
  res.status(200).json({ success });
}
```

### 옵션 2: Google Cloud Functions
```yaml
# serverless.yml
service: camera-report

provider:
  name: google
  runtime: nodejs18
  region: asia-northeast3

functions:
  generateReport:
    handler: index.handler
    events:
      - schedule:
          rate: cron(0 10 * * *)
          timezone: Asia/Seoul
```

### 옵션 3: AWS Lambda + EventBridge
```typescript
// handler.ts
export const handler = async (event: any) => {
  const generator = new ReportGenerator();
  const success = await generator.generateReport();
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success })
  };
};
```

## 모니터링 및 알림

### 1. 실행 로그 확인
- GitHub Actions: Actions 탭에서 실행 기록 확인
- 각 실행의 상세 로그 확인 가능

### 2. 실패 알림 설정
```yaml
# .github/workflows/daily-report.yml에 추가
- name: Send failure notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '카메라 파트 일일 보고서 생성 실패'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. 상태 확인 API
```typescript
// api/status.ts
export async function getReportStatus() {
  const lastRun = await getLastRunTime();
  const nextRun = getNextScheduledTime();
  
  return {
    lastRun,
    nextRun,
    status: 'active'
  };
}
```

## 보안 주의사항

1. **API 키 보호**
   - 절대 코드에 직접 입력하지 않기
   - 환경 변수나 시크릿 사용

2. **Google Docs 권한**
   - 서비스 계정에 최소 권한만 부여
   - 특정 문서에만 접근 허용

3. **Firebase 접근**
   - 읽기 전용 권한 사용
   - 익명 인증으로 충분

## 문제 해결

### Firebase 연결 실패
- Firebase 프로젝트 설정 확인
- 익명 인증 활성화 여부 확인

### Google Docs 쓰기 실패
- 서비스 계정 이메일이 문서에 편집 권한 있는지 확인
- API 활성화 여부 확인

### 스케줄 실행 안 됨
- GitHub Actions 활성화 여부 확인
- 시간대 설정 확인 (UTC vs KST)