# Google 서비스 계정 설정 가이드

## 1. Google Cloud Console에서 서비스 계정 생성

### 단계별 진행:

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택 또는 새 프로젝트 생성

2. **서비스 계정 생성**
   - 좌측 메뉴에서 "IAM 및 관리자" → "서비스 계정" 클릭
   - 상단의 "서비스 계정 만들기" 클릭
   - 서비스 계정 이름: `camera-report-writer`
   - 서비스 계정 ID: 자동 생성됨
   - "만들기 및 계속" 클릭

3. **권한 설정 (선택사항)**
   - 이 단계는 건너뛰어도 됩니다
   - "계속" 클릭

4. **키 생성**
   - "완료" 클릭 후 생성된 서비스 계정 클릭
   - "키" 탭으로 이동
   - "키 추가" → "새 키 만들기" 클릭
   - JSON 형식 선택
   - "만들기" 클릭하면 JSON 파일이 다운로드됨

## 2. Google Docs API 활성화

1. **API 라이브러리**
   - Google Cloud Console에서 "API 및 서비스" → "라이브러리" 클릭
   - "Google Docs API" 검색
   - "사용" 버튼 클릭

## 3. Google Docs 문서에 권한 부여

1. **서비스 계정 이메일 확인**
   - 다운로드한 JSON 파일을 열어서 `client_email` 필드 확인
   - 예: `camera-report-writer@프로젝트ID.iam.gserviceaccount.com`

2. **문서 공유**
   - Google Docs 문서 열기: https://docs.google.com/document/d/1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow/edit
   - 우측 상단 "공유" 버튼 클릭
   - 서비스 계정 이메일 입력
   - "편집자" 권한 부여
   - "보내기" 클릭

## 4. 환경 변수 설정

### 방법 1: JSON 파일 전체 내용 복사 (권장)

```bash
# .env 파일에 추가
GOOGLE_SERVICE_ACCOUNT_KEY='전체 JSON 내용을 여기에 붙여넣기'
```

예시:
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}'
```

### 방법 2: Base64 인코딩 (대안)

```bash
# JSON 파일을 Base64로 인코딩
base64 -i service-account-key.json | tr -d '\n'

# .env 파일에 추가
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64='인코딩된 문자열'
```

코드에서 디코딩:
```javascript
const keyJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString();
const credentials = JSON.parse(keyJson);
```

## 5. 테스트

```bash
# 환경 변수 설정 후 빌드
npm run build

# 테스트 실행
node test-with-api.js
```

## 주의사항

- **보안**: JSON 키 파일은 매우 중요한 인증 정보입니다. 절대 공개 저장소에 업로드하지 마세요.
- **gitignore**: `.env` 파일과 JSON 키 파일은 반드시 `.gitignore`에 포함되어야 합니다.
- **권한**: 서비스 계정은 최소한의 권한만 가져야 합니다.

## 문제 해결

### "The incoming JSON object does not contain a client_email field" 오류
- JSON이 올바른 형식인지 확인
- 작은따옴표로 전체 JSON을 감쌌는지 확인
- JSON 내부의 개행 문자가 올바른지 확인

### 문서 쓰기 권한 오류
- 서비스 계정 이메일이 문서에 편집자로 추가되었는지 확인
- Google Docs API가 활성화되었는지 확인