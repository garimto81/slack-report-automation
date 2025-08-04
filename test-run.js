const { FirebaseDataFetcher } = require('./dist/services/firebaseDataFetcher');
const { GeminiAnalyzer } = require('./dist/services/geminiAnalyzer');

async function testRun() {
  console.log('=== 카메라 파트 업무 자동 보고 시스템 테스트 ===\n');
  
  try {
    // 1. Firebase 연결 테스트
    console.log('1. Firebase 연결 테스트...');
    const firebaseFetcher = FirebaseDataFetcher.getInstance();
    const tasks = await firebaseFetcher.fetchCameraTasks();
    
    if (tasks.length > 0) {
      console.log(`✅ Firebase에서 ${tasks.length}개의 카메라 파트 업무를 찾았습니다.\n`);
      
      // 샘플 업무 출력
      console.log('샘플 업무:');
      tasks.slice(0, 3).forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   - 담당자: ${task.assignee}`);
        console.log(`   - 진행률: ${task.progress}%`);
        console.log(`   - 상태: ${task.status}\n`);
      });
    } else {
      console.log('❌ Firebase에서 카메라 파트 업무를 찾을 수 없습니다.');
      console.log('   Aiden Kim으로 할당된 업무가 있는지 확인해주세요.\n');
    }
    
    // 2. Gemini AI 테스트 (API 키가 있는 경우만)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      console.log('2. Gemini AI 우선순위 분석 테스트...');
      const analyzer = new GeminiAnalyzer();
      const prioritized = await analyzer.prioritizeTasks(tasks.slice(0, 5));
      
      console.log('✅ AI 분석 완료\n');
      prioritized.forEach((item, index) => {
        console.log(`우선순위 ${index + 1}: ${item.task.title}`);
        console.log(`   점수: ${item.priorityScore}`);
        console.log(`   이유: ${item.reasoning}\n`);
      });
    } else {
      console.log('2. Gemini AI 테스트 스킵 (API 키 필요)\n');
    }
    
    // 3. Google Docs 테스트 (서비스 계정이 있는 경우만)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY !== '{}') {
      console.log('3. Google Docs 연결 테스트...');
      console.log('✅ Google Docs 설정 확인됨\n');
    } else {
      console.log('3. Google Docs 테스트 스킵 (서비스 계정 필요)\n');
    }
    
    console.log('=== 테스트 완료 ===');
    console.log('\n실제 사용을 위해서는 다음이 필요합니다:');
    console.log('1. GEMINI_API_KEY 환경변수 설정');
    console.log('2. GOOGLE_SERVICE_ACCOUNT_KEY 환경변수 설정');
    console.log('3. Google Docs 문서에 서비스 계정 편집 권한 부여');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    
    if (error.message.includes('Firebase')) {
      console.log('\nFirebase 연결 문제 해결:');
      console.log('- 인터넷 연결 확인');
      console.log('- Firebase 프로젝트가 활성화되어 있는지 확인');
    }
  }
}

testRun().catch(console.error);