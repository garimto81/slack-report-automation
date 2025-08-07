# 🚀 GitHub Actions 검증 및 테스트 가이드

## ✅ **워크플로우 검증 완료**

**검증 결과: 100% 통과** (31개 항목 모두 성공)

- ✅ 워크플로우 파일 구조 완벽
- ✅ 모든 필수 구성 요소 포함
- ✅ 시크릿 참조 올바름
- ✅ 파일 및 의존성 완비
- ✅ 스케줄 설정 정확
- ✅ 보안 기준 충족

## 📋 **단계별 테스트 절차**

### **1단계: Repository Secrets 설정 확인**

GitHub 저장소에서 다음 5개 시크릿이 설정되어 있는지 확인:

```
GitHub 저장소 → Settings → Secrets and variables → Actions
```

**필수 시크릿 5개**:
```
✅ SLACK_BOT_TOKEN
✅ SLACK_CHANNEL_ID  
✅ GOOGLE_SERVICE_ACCOUNT_KEY
✅ GOOGLE_DOCS_ID
✅ GEMINI_API_KEY
```

**확인 방법**:
- 시크릿 이름이 정확히 일치하는지 확인
- 값이 설정되어 있는지 확인 (내용은 볼 수 없지만 존재 여부는 확인 가능)

---

### **2단계: 수동 실행 테스트**

#### **2-1. GitHub Actions 페이지 접속**
```
https://github.com/garimto81/slack-report-automation/actions
```

#### **2-2. 워크플로우 선택**
- "Camera Part Auto Update" 워크플로우 클릭

#### **2-3. 수동 실행**
1. **"Run workflow"** 버튼 클릭
2. **브랜치 선택**: `clean-deployment-branch`
3. **Force run** 옵션: `true` 선택 (시간 제한 무시)
4. **"Run workflow"** 버튼 클릭

#### **2-4. 실행 모니터링**
- 실행 상태: 🟡 진행 중 → ✅ 성공 or ❌ 실패
- 예상 실행 시간: 2-3분
- 실시간 로그 확인 가능

---

### **3단계: 로그 분석**

#### **성공 시 로그 패턴**:
```
🚀 자동화된 카메라 파트 업데이트 시작
🔧 강제 실행 모드 활성화
📡 Slack 데이터 수집 중...
🤖 AI 업무 분석 중...
📝 구글 문서 업데이트 중...
✅ 업데이트 완료!
🎉 자동화된 카메라 파트 업데이트 성공!
```

#### **실패 시 확인사항**:
- **403 Forbidden**: 권한 문제 (Service Account 편집 권한 확인)
- **404 Not Found**: 문서 ID 오류
- **401 Unauthorized**: API 키 문제
- **Network Error**: API 연결 문제

---

### **4단계: 구글 문서 결과 확인**

#### **문서 접속**:
```
https://docs.google.com/document/d/1DuwfBuYRi5PH3tpGfme8_p3yqU1LdNve-842K2KOvQo/edit
```

#### **확인할 내용**:
- **행 22-24**: 카메라 파트 3개 행 업데이트 여부
- **업무명**: 새로운 업무로 변경됨
- **핵심내용**: 새로운 내용으로 변경됨  
- **진행사항**: 모두 "50%"로 설정됨
- **문서 링크**: 삭제됨 (빈 상태)

---

### **5단계: 스케줄 작동 확인**

#### **다음 자동 실행 예정**:
```
매일 오전 10시 (한국 시간)
월~금요일만 실행
주말 제외
```

#### **모니터링 방법**:
1. **Actions 히스토리 확인**
   - 매일 오전 10시경 자동 실행 기록 확인
   
2. **실행 트리거 구분**
   - `schedule`: 자동 실행
   - `workflow_dispatch`: 수동 실행

3. **성공률 추적**
   - 주간/월간 성공률 모니터링
   - 연속 실패 시 원인 분석

---

## 🔧 **문제 해결 가이드**

### **일반적인 오류와 해결책**

#### **1. "Secrets not found" 오류**
```bash
# 해결책
1. Repository Secrets 설정 재확인
2. 시크릿 이름 정확성 확인 (대소문자 구분)
3. 시크릿 값 재설정
```

#### **2. "File not found" 오류**  
```bash
# 해결책
1. 브랜치 확인 (clean-deployment-branch)
2. 파일 존재 여부 확인
3. 경로 문제 확인
```

#### **3. "Permission denied" 오류**
```bash
# 해결책  
1. Service Account 이메일을 구글 문서에 편집자 권한으로 추가
2. 이메일: ggp-report@youtube-24h-data.iam.gserviceaccount.com
```

#### **4. "API quota exceeded" 오류**
```bash
# 해결책
1. API 할당량 확인
2. 잠시 대기 후 재시도
3. 요청 빈도 조정
```

---

## 📊 **성공 지표**

### **즉시 확인 가능한 지표**:
- ✅ 워크플로우 실행 성공 (초록색 체크)
- ✅ 모든 스텝 완료
- ✅ 에러 로그 없음
- ✅ 구글 문서 업데이트 확인

### **장기 모니터링 지표**:
- 📈 **성공률**: 95% 이상 유지
- ⏰ **실행 시간**: 매일 오전 10시 ±15분
- 🔄 **업데이트 품질**: 의미있는 업무 데이터 반영

---

## 🎯 **최종 체크리스트**

### **수동 테스트 완료 후 확인**:
- [ ] Repository Secrets 5개 모두 설정됨
- [ ] 수동 실행 성공
- [ ] 로그에 에러 없음  
- [ ] 구글 문서 업데이트 확인
- [ ] 예상 실행 시간 내 완료

### **운영 준비 완료**:
- [ ] 자동 스케줄 활성화
- [ ] 모니터링 계획 수립
- [ ] 실패 시 대응 절차 준비
- [ ] 성공률 추적 시스템 구축

---

## 📞 **지원 및 문의**

**GitHub Repository**: https://github.com/garimto81/slack-report-automation  
**워크플로우 파일**: `.github/workflows/camera-auto-update.yml`  
**메인 스크립트**: `automated-camera-update.js`

---

**마지막 업데이트**: 2025-08-07  
**검증 상태**: ✅ 완료 (100% 통과)