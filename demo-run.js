const { FirebaseDataFetcher } = require('./dist/services/firebaseDataFetcher');

async function demoRun() {
  console.log('=== 카메라 파트 업무 데모 실행 ===\n');
  
  try {
    const firebaseFetcher = new FirebaseDataFetcher();
    const tasks = await firebaseFetcher.fetchCameraTasks();
    
    console.log(`✅ Firebase에서 ${tasks.length}개의 카메라 파트 업무를 찾았습니다.\n`);
    
    // 모든 업무 출력
    console.log('=== 카메라 파트 (Aiden Kim) 업무 목록 ===\n');
    
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   카테고리: ${task.category}`);
      console.log(`   진행률: ${task.progress}%`);
      console.log(`   상태: ${task.status}`);
      console.log(`   우선순위: ${task.priority}`);
      if (task.description) {
        console.log(`   설명/URL: ${task.description}`);
      }
      if (task.startDate) {
        console.log(`   시작일: ${task.startDate.toLocaleDateString('ko-KR')}`);
      }
      if (task.endDate) {
        console.log(`   종료일: ${task.endDate.toLocaleDateString('ko-KR')}`);
      }
      console.log('');
    });
    
    // 우선순위별 통계
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;
    
    console.log('=== 우선순위별 통계 ===');
    console.log(`높음: ${highPriority}개`);
    console.log(`중간: ${mediumPriority}개`);
    console.log(`낮음: ${lowPriority}개`);
    
    // 상태별 통계
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    
    console.log('\n=== 상태별 통계 ===');
    console.log(`완료: ${completed}개`);
    console.log(`진행중: ${inProgress}개`);
    console.log(`대기중: ${pending}개`);
    
    // 샘플 보고서 형식
    console.log('\n=== 샘플 보고서 (상위 3개 업무) ===');
    console.log(`날짜: ${new Date().toLocaleDateString('ko-KR')}`);
    console.log('담당자: 카메라 Aiden Kim\n');
    
    tasks.slice(0, 3).forEach((task, index) => {
      console.log(`${index + 1}. 진행 중인 업무 명칭: ${task.title}`);
      console.log(`   핵심 내용(방향성): ${task.description || '업무 진행 중'}`);
      console.log(`   진행사항: ${task.progress}%\n`);
    });
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

demoRun().catch(console.error);