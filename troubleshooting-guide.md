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

### 7. ❌ 쓰레드 관련 오류

#### 증상 1: 실행 시간이 너무 오래 걸림
```
Error: The operation was canceled.
```

**해결 방법:**
1. 채널에 쓰레드가 너무 많은 경우 시간 초과 발생 가능
2. GitHub Actions timeout 설정 확인
3. 필요시 쓰레드 수집 제한 조정

#### 증상 2: 쓰레드 메시지가 보고서에 포함되지 않음

**가능한 원인:**
1. 쓰레드 메시지가 보고 기간 외에 작성됨
2. API 권한 부족
3. 쓰레드 수집 중 오류 발생

**해결 방법:**
1. 로그에서 `Error fetching thread replies` 메시지 확인
2. 봇의 `channels:history` 권한 재확인
3. 특정 쓰레드 ID로 디버깅

#### 증상 3: 메시지 순서가 잘못됨

**해결 방법:**
- 이미 타임스탬프 순 정렬이 적용되어 있음
- 시간대 설정 확인 (서버 시간대)

## 성능 최적화 팁

### 쓰레드가 많은 채널의 경우
1. **일일 보고서 권장**: 처리할 메시지 수가 적음
2. **피크 시간 피하기**: 새벽 시간대 실행 권장
3. **채널 분리 고려**: 업무별로 채널 분리

### API Rate Limit 관리
- 현재: 쓰레드당 1회 추가 API 호출
- 권장: 분당 50개 이하 유지
- 모니터링: Actions 로그에서 429 오류 확인

## 문의사항

추가 문제 발생 시 다음 정보와 함께 보고:
- 오류 메시지 전문
- GitHub Actions 로그
- 실행 시간 (한국시간)
- 채널의 대략적인 메시지/쓰레드 수