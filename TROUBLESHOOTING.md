# 🔧 Troubleshooting Guide

## Google Docs API 관련 문제

### 문제: 텍스트가 중복되거나 잘못된 위치에 입력됨

**증상:**
- 업데이트 시 텍스트가 여러 셀에 걸쳐 중복됨
- 의도하지 않은 셀에 텍스트가 입력됨
- 기존 텍스트와 새 텍스트가 섞임

**원인:**
- Google Docs API의 인덱스 기반 업데이트 충돌
- `insertText`와 `replaceAllText` 동시 사용 시 인덱스 변경
- 테이블 구조의 복잡성

**해결 방법:**
1. 문서 진단 도구 실행:
   ```bash
   node diagnose-table-issue.js
   ```

2. 문제 셀 정리:
   ```bash
   node precise-fix.js
   ```

3. 수동 정리가 필요한 경우:
   - Google Docs에서 직접 문제 셀 내용 삭제
   - 깨끗한 상태에서 자동화 재실행

**예방 방법:**
- `replaceAllText`만 사용 (빈 셀 업데이트 피하기)
- 단계별 업데이트 실행
- Google Sheets 사용 고려

### 문제: 403 Forbidden 에러

**증상:**
- "The caller does not have permission" 에러 메시지

**해결 방법:**
1. Service Account 이메일 확인:
   ```bash
   cat service-account-key-fixed.json | grep client_email
   ```

2. Google Docs에 편집자 권한 추가:
   - 문서 열기 → 공유 → Service Account 이메일 추가
   - 편집자 권한 부여

### 문제: 빈 셀 업데이트 실패

**증상:**
- 빈 셀에 텍스트가 입력되지 않음
- "Invalid insertion index" 에러

**해결 방법:**
1. 수동으로 더미 텍스트 입력 ("-")
2. 자동화 실행으로 교체
3. 또는 Google Sheets로 마이그레이션

## Slack API 관련 문제

### 문제: 메시지 수집 실패

**증상:**
- "invalid_auth" 또는 "not_in_channel" 에러

**해결 방법:**
1. Bot Token 확인:
   ```bash
   echo $SLACK_BOT_TOKEN
   ```

2. 채널에 봇 추가:
   - Slack에서 /invite @봇이름

3. 권한 스코프 확인:
   - channels:history
   - channels:read
   - chat:write

## GitHub Actions 관련 문제

### 문제: 워크플로우 실행 실패

**증상:**
- "Process completed with exit code 1"

**확인 사항:**
1. Repository Secrets 설정:
   - SLACK_BOT_TOKEN
   - SLACK_CHANNEL_ID
   - GOOGLE_SERVICE_ACCOUNT_KEY
   - GOOGLE_DOCS_ID
   - GEMINI_API_KEY

2. 브랜치 확인:
   ```bash
   git branch
   ```

3. 워크플로우 파일 위치:
   - `.github/workflows/camera-auto-update.yml`

### 문제: 스케줄 실행 안됨

**증상:**
- 정해진 시간에 워크플로우가 실행되지 않음

**확인 사항:**
1. Cron 표현식:
   ```yaml
   - cron: '0 1 * * 1-5'  # UTC 01:00 = KST 10:00
   ```

2. 워크플로우 활성화 상태:
   - GitHub Actions 탭에서 확인

## 환경 설정 관련 문제

### 문제: 환경 변수 인식 실패

**증상:**
- "Cannot read properties of undefined"

**해결 방법:**
1. `.env` 파일 확인:
   ```bash
   cat .env | grep GOOGLE
   ```

2. 변수명 일치 확인:
   - `GOOGLE_DOCS_ID` (not GOOGLE_DOC_ID)
   - `SLACK_CHANNEL_ID` (not SLACK_CHANNEL)

3. `.env.example` 참조:
   ```bash
   cp .env.example .env
   # 실제 값으로 수정
   ```

## 성능 관련 문제

### 문제: 업데이트 속도 느림

**원인:**
- 대량의 메시지 처리
- API 속도 제한

**해결 방법:**
1. 메시지 수집 기간 제한:
   ```javascript
   const messages = await slackApi.getMessages(
     channelId, 
     startTime,  // 특정 날짜만
     endTime
   );
   ```

2. 배치 업데이트 최적화:
   - 한 번에 모든 요청 전송
   - 불필요한 대기 시간 제거

## 디버깅 도구

### 사용 가능한 진단 스크립트

```bash
# 테이블 구조 분석
node diagnose-table-issue.js

# 문서 전체 구조 확인
node analyze-document-structure.js

# 단계별 테스트
node step-by-step-test.js

# GitHub Actions 검증
node validate-github-actions.js
```

### 로그 레벨 설정

```javascript
// 상세 로그 활성화
process.env.DEBUG = 'true';
```

## 자주 묻는 질문 (FAQ)

**Q: 자동화가 특정 행만 업데이트하나요?**
A: 네, 카메라 파트(행 22-24)만 업데이트합니다.

**Q: 주말에도 실행되나요?**
A: 아니요, 평일(월-금)만 실행됩니다.

**Q: 수동으로 실행할 수 있나요?**
A: 네, GitHub Actions에서 "Run workflow" 버튼 사용

**Q: 다른 문서로 변경 가능한가요?**
A: 네, `.env`의 `GOOGLE_DOCS_ID` 수정

## 추가 지원

- GitHub Issues: https://github.com/garimto81/slack-report-automation/issues
- 문서: https://github.com/garimto81/slack-report-automation/wiki

---

최종 업데이트: 2025-08-07