# 마이그레이션 가이드: v1.0.0 → v1.1.0

이 가이드는 기존 사용자가 다중 사용자 지원 버전으로 업그레이드하는 방법을 설명합니다.

## 🚨 중요한 변경사항

환경 변수 이름이 변경되었습니다:
- **이전**: `SLACK_DM_USER_ID` (단수)
- **현재**: `SLACK_DM_USER_IDS` (복수)

## 📋 마이그레이션 단계

### 1. 로컬 환경 (.env 파일)

#### 단일 사용자 유지
```bash
# 이전
SLACK_DM_USER_ID=U080BA70DC4

# 변경 후 (같은 사용자 유지)
SLACK_DM_USER_IDS=U080BA70DC4
```

#### 여러 사용자 추가
```bash
# 여러 사용자에게 전송 (쉼표로 구분)
SLACK_DM_USER_IDS=U080BA70DC4,U1234567890,U9876543210
```

### 2. GitHub Secrets 업데이트

1. GitHub 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions**
3. 기존 시크릿 삭제:
   - `SLACK_DM_USER_ID` 옆의 🗑️ 클릭
4. 새 시크릿 추가:
   - **New repository secret** 클릭
   - Name: `SLACK_DM_USER_IDS`
   - Value: 사용자 ID (쉼표로 구분)
   - **Add secret** 클릭

### 3. 코드 업데이트

최신 버전으로 업데이트:
```bash
git pull origin main
npm install
npm run build
```

### 4. 동작 확인

#### 로컬 테스트
```bash
# .env 파일 확인
cat .env | grep SLACK_DM_USER_IDS

# 테스트 실행
node dist/src/generate-report.js --type daily
```

#### GitHub Actions 테스트
1. Actions 탭으로 이동
2. "Slack Reports" 워크플로우 선택
3. "Run workflow" 클릭
4. 실행 후 로그 확인

## ⚠️ 일반적인 문제 해결

### 오류: Missing required environment variable: SLACK_DM_USER_IDS

**원인**: 아직 이전 환경 변수명 사용 중

**해결**:
1. `.env` 파일에서 `SLACK_DM_USER_ID`를 `SLACK_DM_USER_IDS`로 변경
2. GitHub Secrets에서도 동일하게 변경

### 오류: 일부 사용자가 메시지를 받지 못함

**가능한 원인**:
1. 잘못된 사용자 ID
2. 봇이 해당 사용자에게 DM을 보낼 권한 없음

**해결**:
1. 사용자 ID 재확인 (Slack 프로필에서 복사)
2. 봇에 `im:write` 권한이 있는지 확인
3. 사용자가 봇을 차단하지 않았는지 확인

## 🔄 롤백 방법

이전 버전으로 돌아가려면:

```bash
# 이전 커밋으로 되돌리기
git checkout <이전-커밋-해시>

# 환경 변수 이름 복원
# .env와 GitHub Secrets에서
# SLACK_DM_USER_IDS → SLACK_DM_USER_ID
```

## 📊 변경 사항 요약

| 항목 | v1.0.0 | v1.1.0 |
|------|--------|--------|
| 환경 변수 | SLACK_DM_USER_ID | SLACK_DM_USER_IDS |
| 사용자 수 | 1명만 | 여러 명 (쉼표 구분) |
| ReportService | dmUserId: string | dmUserIds: string[] |
| Scheduler | dmUserId: string | dmUserIds: string[] |
| Supabase 저장 | 단일 사용자 ID | 쉼표로 구분된 ID들 |

## 💡 추가 기능 활용

### 팀별 보고서 전송
```bash
# 개발팀
SLACK_DM_USER_IDS=U_DEV1,U_DEV2,U_DEV3

# 매니저 그룹
SLACK_DM_USER_IDS=U_MANAGER1,U_MANAGER2
```

### 조건부 수신자
향후 업데이트에서 보고서 타입별로 다른 수신자 설정 가능 예정

## 📞 지원

문제가 있으시면:
1. [Issues 페이지](https://github.com/garimto81/slack-report-automation/issues)에 문의
2. [CHANGELOG.md](CHANGELOG.md)에서 상세 변경사항 확인
3. [troubleshooting-guide.md](troubleshooting-guide.md) 참조