# GitHub Actions 문제 해결 가이드

## 자주 발생하는 문제와 해결 방법

### 1. ❌ Secrets 관련 오류
```
Missing required environment variable: SLACK_BOT_TOKEN
```

**해결 방법:**
1. GitHub 저장소 Settings → Secrets and variables → Actions
2. 다음 시크릿이 모두 설정되었는지 확인:
   - `SLACK_BOT_TOKEN`
   - `SLACK_CHANNEL_ID`
   - `SLACK_DM_USER_IDS` (여러 사용자는 쉼표로 구분)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

### 2. ❌ npm ci 오류
```
npm ERR! Cannot read properties of undefined
```

**해결 방법:**
package-lock.json이 최신 상태인지 확인

### 3. ❌ Build 오류
```
src/services/report.service.ts(93,23): error TS18048
```

**해결 방법:**
TypeScript 타입 오류 - 이미 수정됨

### 4. ❌ Slack 권한 오류
```
missing_scope: channels:history
```

**해결 방법:**
1. Slack 앱 OAuth & Permissions 확인
2. 필요한 권한:
   - `channels:history`
   - `chat:write`
   - `im:write`
3. 봇이 채널에 추가되었는지 확인

### 5. ❌ Gemini API 오류
```
Error: 403 Forbidden
```

**해결 방법:**
1. Gemini API 키가 올바른지 확인
2. API 할당량 확인

### 6. ❌ Supabase 연결 오류
```
Error saving report: {}
```

**해결 방법:**
1. Supabase URL과 ANON_KEY 확인
2. 테이블이 생성되었는지 확인:
   ```sql
   -- supabase/migrations/001_create_reports_table.sql 실행
   ```

## 디버깅 방법

### 1. GitHub Actions 로그 확인
1. Actions 탭 → 실패한 워크플로우 클릭
2. 각 단계 펼쳐서 상세 로그 확인

### 2. 로컬 테스트
```bash
# 환경변수 설정 (.env 파일)
node dist/src/generate-report.js --type daily
```

### 3. 권한 테스트
```bash
node debug-slack-permissions.js
```

## 성공 확인 방법

1. **GitHub Actions**: 모든 단계가 ✅ 초록색
2. **Slack DM**: SLACK_DM_USER_IDS에 설정된 모든 사용자들이 보고서 수신
3. **보고서 형식**:
   ```
   *일일 업무 보고*
   
   • 카메라 긴급 수리 요청 처리
   • 신제품 촬영을 위한 스튜디오 준비
   • 영상 편집 및 색보정 완료
   ```

## 문의사항

추가 문제 발생 시 다음 정보와 함께 보고:
- 오류 메시지 전문
- GitHub Actions 로그
- 실행 시간 (한국시간)