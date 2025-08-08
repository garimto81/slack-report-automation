# 📅 카메라 파트 자동 업데이트 설정 가이드

## ⭐️ **2025-08-08 최적화 업데이트**
**워크플로우 중복 문제 해결**: 기존 5개 워크플로우에서 발생했던 중복 알림 문제가 완전히 해결되어, 이제 카메라 자동 업데이트가 독립적으로 안정적으로 실행됩니다.

## 🎯 개요

평일 오전 10시에 자동으로 카메라 파트 업무를 업데이트하는 GitHub Actions 기반 자동화 시스템입니다. 다른 워크플로우와의 충돌 없이 독립적으로 실행됩니다.

## 📋 자동화 로직

### ⏰ 실행 스케줄
- **실행 시간**: 평일 오전 10시 (한국 시간)
- **실행 요일**: 월요일 ~ 금요일
- **주말 제외**: 토요일, 일요일 자동 건너뜀

### 📊 분석 데이터 기준
- **월요일**: 전주 금요일 업무 분석 (3일 전 데이터)
- **화~금요일**: 전날 업무 분석 (1일 전 데이터)

### 🔄 업데이트 프로세스
1. **Slack 데이터 수집**: 해당 날짜의 채널 메시지 수집
2. **AI 분석**: Gemini AI로 상위 3개 업무 추출
3. **문서 업데이트**: 구글 문서 카메라 파트 자동 업데이트
4. **진행률 설정**: 모든 업무 50%로 자동 설정
5. **링크 정리**: 문서 링크 자동 삭제

## 🔧 GitHub Actions 설정

### 1. Repository Secrets 설정

GitHub 저장소 Settings > Secrets and variables > Actions에서 다음 secrets 추가:

```
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C0875HJ79NW
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_DOCS_ID=1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow
GEMINI_API_KEY=your-gemini-api-key
```

### 2. 워크플로우 파일 위치
```
.github/workflows/camera-auto-update.yml
```

### 3. 수동 실행
GitHub Actions 탭에서 "Camera Part Auto Update" 워크플로우를 수동으로 실행 가능

## 📝 로컬 테스트

### 자동화 스크립트 테스트
```bash
npm run camera:auto
```

### 스케줄 시간 확인
```bash
npm run schedule:test
```

### 개별 기능 테스트
```bash
# Slack 연결 테스트
npm run analyze

# 구글 문서 테스트
npm run camera:test

# 실제 업데이트 테스트
npm run camera:update
```

## 🛠️ 주요 파일

| 파일명 | 역할 |
|--------|------|
| `automated-camera-update.js` | 메인 자동화 스크립트 |
| `slack-api.js` | Slack API 래퍼 클래스 |
| `camera-auto-update.yml` | GitHub Actions 워크플로우 |
| `top-tasks-processor.js` | AI 업무 분석 로직 |

## 🔍 모니터링

### GitHub Actions 로그 확인
1. GitHub 저장소 > Actions 탭
2. "Camera Part Auto Update" 워크플로우 선택
3. 실행 로그에서 상세 결과 확인

### 로그 예시
```
🚀 자동화된 카메라 파트 업데이트 시작
🗓️ 현재 한국 시간: 2025-08-08 10:00:00
📅 오늘 요일: 목요일
📊 분석 대상: 어제 (2025-08-07)
📡 Slack 데이터 수집 중...
✅ 3개 메시지 수집 완료
🤖 AI 업무 분석 중...
✅ AI 분석 완료: 3개 업무 추출
📝 구글 문서 업데이트 중...
✅ 6개 업데이트 완료
🎉 자동화된 카메라 파트 업데이트 성공!
```

## ⚠️ 문제 해결

### 일반적인 오류

1. **Slack API 연결 실패**
   - `SLACK_BOT_TOKEN` 확인
   - 봇 권한 설정 확인

2. **Google Docs 접근 실패**
   - `GOOGLE_SERVICE_ACCOUNT_KEY` 형식 확인
   - 문서 공유 권한 확인

3. **Gemini API 오류**
   - `GEMINI_API_KEY` 유효성 확인
   - API 할당량 확인

### 수동 복구 방법
```bash
# 로컬에서 수동 실행
cd slack-report-automation
node automated-camera-update.js

# 강제 실행 (시간 제한 무시)
FORCE_RUN=true node automated-camera-update.js
```

## 📈 향후 개선사항

- [ ] 실패 시 Slack 알림 기능
- [ ] 업데이트 내역 히스토리 저장
- [ ] 다른 파트 자동화 확장
- [ ] 커스텀 스케줄 설정 지원

## 🤝 기여 가이드

1. 새 기능 개발 시 `automated-camera-update.js` 수정
2. 테스트 후 GitHub Actions에서 검증
3. 문서 업데이트 필수

---

**마지막 업데이트**: 2025-08-08 (워크플로우 최적화 완료)  
**담당**: 카메라팀