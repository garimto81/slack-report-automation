const { FirebaseDataFetcher } = require('./dist/services/firebaseDataFetcher');

async function firebaseConnectionTest() {
  console.log('🚀 Firebase 연동 테스트 시작');
  console.log('='.repeat(50));
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('');

  try {
    // 성능 측정을 위한 시작 시간
    const totalStartTime = Date.now();
    
    console.log('1️⃣ Firebase 인스턴스 생성...');
    const instanceStartTime = Date.now();
    const fetcher = FirebaseDataFetcher.getInstance();
    console.log(`   ⏱️ 인스턴스 생성 시간: ${Date.now() - instanceStartTime}ms`);
    
    console.log('\n2️⃣ Firebase 인증 중...');
    const authStartTime = Date.now();
    await fetcher.initialize();
    console.log(`   ⏱️ 인증 시간: ${Date.now() - authStartTime}ms`);
    
    console.log('\n3️⃣ 카메라 파트 업무 데이터 수집 중...');
    const fetchStartTime = Date.now();
    const tasks = await fetcher.fetchCameraTasks();
    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`   ⏱️ 데이터 수집 시간: ${fetchDuration}ms`);
    
    const totalDuration = Date.now() - totalStartTime;
    
    console.log('\n📊 테스트 결과 요약');
    console.log('='.repeat(50));
    console.log(`✅ 연결 성공: Firebase Firestore`);
    console.log(`📈 수집된 업무 수: ${tasks.length}개`);
    console.log(`⏱️ 총 소요 시간: ${totalDuration}ms (${(totalDuration/1000).toFixed(1)}초)`);
    
    if (tasks.length > 0) {
      console.log('\n📋 데이터 구조 분석');
      console.log('-'.repeat(30));
      
      // 상태별 통계
      const statusStats = {};
      const categoryStats = {};
      const priorityStats = {};
      let totalProgress = 0;
      
      tasks.forEach(task => {
        // 상태별 카운트
        statusStats[task.status] = (statusStats[task.status] || 0) + 1;
        
        // 카테고리별 카운트
        categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
        
        // 우선순위별 카운트
        priorityStats[task.priority] = (priorityStats[task.priority] || 0) + 1;
        
        // 진행률 누적
        totalProgress += task.progress;
      });
      
      console.log('📊 상태별 분포:');
      Object.entries(statusStats).forEach(([status, count]) => {
        const percentage = Math.round((count / tasks.length) * 100);
        console.log(`   ${status}: ${count}개 (${percentage}%)`);
      });
      
      console.log('\n📂 카테고리별 분포:');
      Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count}개`);
        });
      
      console.log('\n⭐ 우선순위별 분포:');
      Object.entries(priorityStats).forEach(([priority, count]) => {
        console.log(`   ${priority}: ${count}개`);
      });
      
      const avgProgress = Math.round(totalProgress / tasks.length);
      console.log(`\n📈 평균 진행률: ${avgProgress}%`);
      
      // 샘플 데이터 출력
      console.log('\n📝 샘플 업무 데이터 (최신 3개):');
      console.log('-'.repeat(50));
      tasks.slice(0, 3).forEach((task, index) => {
        console.log(`${index + 1}. ${task.title}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   담당자: ${task.assignee}`);
        console.log(`   상태: ${task.status} (${task.progress}%)`);
        console.log(`   카테고리: ${task.category}`);
        console.log(`   우선순위: ${task.priority}`);
        if (task.description) {
          console.log(`   설명: ${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}`);
        }
        if (task.startDate) {
          console.log(`   시작일: ${task.startDate.toLocaleDateString('ko-KR')}`);
        }
        console.log('');
      });
      
      // 성능 분석
      console.log('⚡ 성능 분석');
      console.log('-'.repeat(30));
      console.log(`평균 처리 속도: ${Math.round(tasks.length / (totalDuration/1000))} 업무/초`);
      
      if (totalDuration < 3000) {
        console.log('🟢 성능: 우수 (3초 미만)');
      } else if (totalDuration < 5000) {
        console.log('🟡 성능: 양호 (3-5초)');
      } else if (totalDuration < 10000) {
        console.log('🟠 성능: 보통 (5-10초)');
      } else {
        console.log('🔴 성능: 개선 필요 (10초 이상)');
      }
      
      // 캐시 테스트
      console.log('\n🔄 캐시 성능 테스트');
      console.log('-'.repeat(30));
      const cacheStartTime = Date.now();
      const cachedTasks = await fetcher.fetchCameraTasks();
      const cacheDuration = Date.now() - cacheStartTime;
      
      console.log(`캐시된 데이터 수집 시간: ${cacheDuration}ms`);
      console.log(`캐시 효과: ${Math.round(((fetchDuration - cacheDuration) / fetchDuration) * 100)}% 빨라짐`);
      
      if (cacheDuration < 100) {
        console.log('✅ 캐시가 정상적으로 작동하고 있습니다');
      } else {
        console.log('⚠️ 캐시가 예상보다 느립니다');
      }
      
    } else {
      console.log('⚠️ Aiden Kim으로 할당된 업무가 없습니다');
      console.log('   Firebase 데이터베이스에서 assignees 필드를 확인해주세요');
    }
    
  } catch (error) {
    console.log('\n❌ Firebase 연동 테스트 실패');
    console.log('='.repeat(50));
    console.error('오류 내용:', error.message);
    
    if (error.message.includes('auth')) {
      console.log('\n🔧 해결 방안:');
      console.log('1. Firebase 프로젝트 설정 확인');
      console.log('2. 익명 인증이 활성화되어 있는지 확인');
      console.log('3. 네트워크 연결 상태 확인');
    } else if (error.message.includes('permission')) {
      console.log('\n🔧 해결 방안:');
      console.log('1. Firestore 보안 규칙 확인');
      console.log('2. 익명 사용자 읽기 권한 확인');
    } else {
      console.log('\n🔧 일반적인 해결 방안:');
      console.log('1. 인터넷 연결 확인');
      console.log('2. Firebase 서비스 상태 확인');
      console.log('3. 프로젝트 설정 재확인');
    }
    
    return false;
  }
  
  console.log('\n🎉 Firebase 연동 테스트 완료');
  console.log('완료 시간:', new Date().toLocaleString('ko-KR'));
  return true;
}

// 테스트 실행
firebaseConnectionTest()
  .then(success => {
    if (success) {
      console.log('\n🚀 다음 단계: API 키를 설정하여 전체 시스템 테스트를 진행하세요');
    }
  })
  .catch(console.error);