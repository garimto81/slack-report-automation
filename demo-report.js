const { FirebaseDataFetcher } = require('./dist/services/firebaseDataFetcher');

async function generateDemoReport() {
  console.log('=== 카메라 파트 업무 보고서 (데모) ===\n');
  console.log(`날짜: ${new Date().toLocaleDateString('ko-KR')}`);
  console.log('담당자: 카메라 Aiden Kim');
  console.log('보고 시간:', new Date().toLocaleTimeString('ko-KR'));
  console.log('\n=====================================\n');
  
  try {
    const firebaseFetcher = FirebaseDataFetcher.getInstance();
    const tasks = await firebaseFetcher.fetchCameraTasks();
    
    console.log(`총 ${tasks.length}개의 업무가 있습니다.\n`);
    
    // 상태별로 분류
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    // 우선순위 시뮬레이션 (진행중 > 대기중 > 완료 순)
    const prioritizedTasks = [
      ...inProgressTasks,
      ...pendingTasks,
      ...completedTasks
    ].slice(0, 3);
    
    console.log('【주요 업무 3개】\n');
    
    prioritizedTasks.forEach((task, index) => {
      console.log(`${index + 1}. 진행 중인 업무 명칭: ${task.title}`);
      console.log(`   핵심 내용(방향성): ${task.description || '카메라 파트 핵심 업무'}`);
      console.log(`   진행사항: ${task.progress}%`);
      console.log(`   상태: ${task.status === 'completed' ? '완료' : task.status === 'in-progress' ? '진행중' : '대기중'}`);
      console.log('');
    });
    
    console.log('\n【전체 통계】');
    console.log(`- 완료: ${completedTasks.length}개 (${Math.round(completedTasks.length/tasks.length*100)}%)`);
    console.log(`- 진행중: ${inProgressTasks.length}개 (${Math.round(inProgressTasks.length/tasks.length*100)}%)`);
    console.log(`- 대기중: ${pendingTasks.length}개 (${Math.round(pendingTasks.length/tasks.length*100)}%)`);
    
    console.log('\n【카테고리별 분포】');
    const categories = {};
    tasks.forEach(task => {
      categories[task.category] = (categories[task.category] || 0) + 1;
    });
    
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([category, count]) => {
        console.log(`- ${category}: ${count}개`);
      });
    
    console.log('\n=====================================');
    console.log('\n이 보고서는 데모 버전입니다.');
    console.log('실제 사용을 위해서는 다음이 필요합니다:');
    console.log('1. Gemini API 키 - AI 우선순위 분석');
    console.log('2. Google 서비스 계정 - 문서 자동 작성');
    console.log('\n설정 파일: .env');
    
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
}

generateDemoReport().catch(console.error);