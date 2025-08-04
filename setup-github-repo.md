# GitHub 리포지토리 설정 가이드

## 1. GitHub에서 새 리포지토리 생성

1. **GitHub.com 접속**
   - https://github.com/new 로 이동

2. **리포지토리 정보 입력**
   - Repository name: `ggp-report`
   - Description: `카메라 파트 업무 자동 보고 시스템`
   - Public 선택
   - **중요**: "Initialize this repository with:" 섹션의 모든 체크박스를 **해제** (README, .gitignore, license 추가하지 않음)
   - "Create repository" 클릭

## 2. 로컬에서 코드 푸시

터미널에서 다음 명령어 실행:

```bash
# 현재 디렉토리에서
git push -u origin main
```

만약 에러가 발생하면:

```bash
# 브랜치 이름 확인
git branch

# main이 아니라 다른 이름이면
git push -u origin 현재브랜치명
```

## 3. GitHub Actions Secrets 설정

푸시가 완료되면:

1. https://github.com/garimto81/ggp-report/settings/secrets/actions 접속
2. "New repository secret" 클릭
3. 다음 두 개의 시크릿 추가:
   - `GEMINI_API_KEY`: Gemini API 키
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Google 서비스 계정 JSON

## 4. 테스트 실행

1. https://github.com/garimto81/ggp-report/actions 접속
2. "Test Run" 워크플로우 선택
3. "Run workflow" 버튼 클릭

## 문제 해결

### Permission denied 에러
```bash
# SSH 대신 HTTPS 사용
git remote set-url origin https://github.com/garimto81/ggp-report.git

# 또는 Personal Access Token 사용
git remote set-url origin https://YOUR_TOKEN@github.com/garimto81/ggp-report.git
```

### 브랜치 이름 문제
```bash
# main 브랜치로 변경
git branch -M main
git push -u origin main
```