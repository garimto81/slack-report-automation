# GitHub Secrets 설정 가이드

## 1. GitHub 리포지토리에 Secrets 추가

### 단계별 진행:

1. **GitHub 리포지토리 페이지 접속**
   - 리포지토리로 이동

2. **Settings 탭 클릭**
   - 리포지토리 상단 메뉴에서 Settings 클릭

3. **Secrets and variables → Actions 클릭**
   - 좌측 메뉴에서 Security 섹션 아래에 있음

4. **New repository secret 클릭**

### GEMINI_API_KEY 추가:
- **Name**: `GEMINI_API_KEY`
- **Secret**: Gemini API 키 값 입력
- **Add secret** 클릭

### GOOGLE_SERVICE_ACCOUNT_KEY 추가:
- **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Secret**: Google 서비스 계정 JSON 전체 내용 붙여넣기
  ```json
  {
    "type": "service_account",
    "project_id": "your-project",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "...",
    "client_id": "...",
    "auth_uri": "...",
    "token_uri": "...",
    "auth_provider_x509_cert_url": "...",
    "client_x509_cert_url": "..."
  }
  ```
- **Add secret** 클릭

## 2. 수동 테스트 실행

1. **Actions 탭 클릭**
2. **Daily Camera Report** 워크플로우 선택
3. **Run workflow** 버튼 클릭
4. **Run workflow** 확인

## 3. 실행 결과 확인

- 워크플로우 실행 중 상태 확인
- 각 단계별 로그 확인
- 성공 시 Google Docs에서 결과 확인

## 주의사항

- Secrets는 한 번 저장하면 내용을 볼 수 없음 (보안상)
- 수정이 필요하면 Update로 덮어쓰기
- JSON 형식이 올바른지 확인 (특히 따옴표와 이스케이프)