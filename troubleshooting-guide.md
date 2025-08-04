# GitHub Actions 문제 해결 가이드 (v1.3.0)

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

### 5. ❌ 월간 보고서가 매일 실행되는 문제 (✅ v1.3.0에서 수정됨)
```
Monthly report running daily instead of first Monday only
```

**원인:**
- 잘못된 cron 표현식: `0 1 1-7 * 1`
- 이 표현식은 "1-7일 AND 모든 월요일"로 해석되어 매일 실행

**해결 방법 (v1.3.0):**
1. 첫째 주 월요일 체크 로직 추가
2. 조건부 실행으로 변경
3. 이제 매월 첫째 주 월요일에만 정확히 실행

### 6. ❌ "no work to report" 문제
```
안녕하세요! 오늘은 보고할 업무가 없습니다.
```

**원인:**
- 메시지는 수집되지만 AI가 카메라 파트 관련 업무가 없다고 판단
- 단순 키워드 검색이 아닌 AI 문맥 분석 기반

**디버깅 방법:**
1. Actions 탭 → "Debug Report Issue" 워크플로우 실행
2. 메시지 수집 상태 확인
3. AI 분석 결과 및 추론 과정 확인
4. 실제 카메라 관련 업무가 있는지 내용 검토

### 7. ❌ Gemini API 오류
```
Error: 403 Forbidden
```

**해결 방법:**
1. Gemini API 키가 올바른지 확인
2. API 할당량 확인

### 8. ❌ Supabase 연결 오류
```
Error saving report: {}
```

**해결 방법:**
1. Supabase URL과 ANON_KEY 확인
2. 테이블이 생성되었는지 확인:
   ```sql
   -- supabase/migrations/001_create_reports_table.sql 실행
   ```

## 디버깅 방법 (v1.3.0 개선)

### 1. 새로운 디버깅 워크플로우 사용
1. Actions 탭 → "Debug Report Issue" 선택
2. "Run workflow" → 보고서 타입 선택
3. 로그에서 다음 내용 확인:
   - 메시지 수집 결과
   - 쓰레드 처리 상태
   - AI 분석 과정
   - 카메라 파트 업무 추론 결과

### 2. GitHub Actions 로그 확인
1. Actions 탭 → 실패한 워크플로우 클릭
2. 각 단계 펼쳐서 상세 로그 확인

### 3. 로컬 테스트 (v1.3.0 경로 수정)
```bash
# 환경변수 설정 (.env 파일)
node dist/generate-report.js --type daily  # 수정된 경로
```

### 4. 권한 테스트
```bash
node debug-slack-permissions.js
```

### 5. 프로젝트 웹사이트 활용
[프로젝트 소개 페이지](https://garimto81.github.io/slack-report-automation/)에서:
- 시각적 프로세스 다이어그램 확인
- AI 분석 방식 이해
- 실행 스케줄 캐리더 참고

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
4. **스케줄 확인** (v1.3.0):
   - 첫째 주 월요일: 월간 보고서만 실행
   - 나머지 월요일: Monthly-Weekly (10:00) + Weekly (10:10)
   - 화-금요일: 일일 보고서만 실행

## v1.3.0 주요 개선 사항

1. **월간 보고서 버그 수정**: 매일 실행 → 첫째 주 월요일만
2. **Monthly-Weekly 보고서 추가**: 10분 간격 실행 로직
3. **디버깅 도구 강화**: AI 분석 중심 디버깅
4. **GitHub Pages 웹사이트**: 시각적 프로젝트 소개
5. **빌드 경로 수정**: `dist/src/` → `dist/`

## 문의사항

추가 문제 발생 시 다음 정보와 함께 보고:
- 오류 메시지 전문
- GitHub Actions 로그
- 실행 시간 (한국시간)
- Debug Report Issue 워크플로우 결과
- 프로젝트 웹사이트 참고: https://garimto81.github.io/slack-report-automation/