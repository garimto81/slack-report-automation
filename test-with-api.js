const { ReportGenerator } = require('./dist/services/reportGenerator');

async function testWithAPI() {
  console.log('=== 카메라 파트 업무 자동 보고 시스템 전체 테스트 ===\n');
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('');
  
  try {
    const generator = new ReportGenerator();
    const success = await generator.generateReport();
    
    if (success) {
      console.log('\n✅ 보고서 생성 성공!');
      console.log('Google Docs에서 결과를 확인해주세요.');
      console.log('문서 링크: https://docs.google.com/document/d/1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow/edit');
    } else {
      console.log('\n❌ 보고서 생성 실패');
      console.log('로그를 확인해주세요.');
    }
    
    console.log('\n완료 시간:', new Date().toLocaleString('ko-KR'));
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\nGemini API 키 확인:');
      console.log('- .env 파일에 GEMINI_API_KEY가 올바르게 설정되어 있는지 확인');
      console.log('- https://makersuite.google.com/app/apikey 에서 키 발급');
    }
    
    if (error.message.includes('client_email')) {
      console.log('\nGoogle 서비스 계정 확인:');
      console.log('- .env 파일에 GOOGLE_SERVICE_ACCOUNT_KEY가 JSON 형식으로 설정되어 있는지 확인');
      console.log('- Google Cloud Console에서 서비스 계정 생성 및 키 다운로드');
    }
  }
}

testWithAPI().catch(console.error);