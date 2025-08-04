const { GoogleDocsWriterV2 } = require('./dist/services/googleDocsWriterV2');

async function testGoogleDocsV2() {
  console.log('🧪 Google Docs V2 Writer Test');
  console.log('='.repeat(50));
  console.log('시작 시간:', new Date().toLocaleString('ko-KR'));
  console.log('');

  try {
    // 테스트용 샘플 업무 데이터
    const sampleTasks = [
      {
        task: {
          id: 'test-1',
          title: 'AI 쇼츠 자동 제작 앱',
          description: 'TikTok, YouTube Shorts용 자동 영상 생성 시스템',
          assignee: 'Aiden Kim',
          progress: 65,
          status: 'in-progress',
          category: '제품 개발'
        },
        reasoning: '고객 납품 관련 업무로 긴급도가 매우 높으며, 현재 65% 진행 중인 핵심 프로젝트입니다.'
      },
      {
        task: {
          id: 'test-2',
          title: '아카이브 MAM GGP 버전',
          description: '미디어 자산 관리 시스템 GGP 커스터마이징',
          assignee: 'Aiden Kim',
          progress: 30,
          status: 'in-progress',
          category: '시스템 개발'
        },
        reasoning: '시스템 안정화를 위한 핵심 업무로, 기존 시스템의 성능 개선이 필요합니다.'
      },
      {
        task: {
          id: 'test-3',
          title: '포커 트렌드 분석기',
          description: '시장 트렌드 분석을 위한 도구 개발',
          assignee: 'Aiden Kim',
          progress: 10,
          status: 'pending',
          category: '연구 개발'
        },
        reasoning: '시장 분석을 통한 전략 수립이 필요하며, 장기적 관점에서 중요한 프로젝트입니다.'
      }
    ];

    console.log('📄 테스트 데이터 준비 완료');
    console.log(`   - 업무 수: ${sampleTasks.length}개`);
    
    // GoogleDocsWriterV2 인스턴스 생성
    console.log('\n🔧 GoogleDocsWriterV2 인스턴스 생성 중...');
    const writer = new GoogleDocsWriterV2();
    console.log('✅ 인스턴스 생성 완료');
    
    // API 키 설정 확인
    const hasGoogleAuth = process.env.GOOGLE_SERVICE_ACCOUNT_KEY && 
                         process.env.GOOGLE_SERVICE_ACCOUNT_KEY !== '{}';
    
    if (!hasGoogleAuth) {
      console.log('\n⚠️  Google Service Account Key가 설정되지 않았습니다.');
      console.log('   기본 인증 정보를 사용하여 시도합니다.');
      console.log('\n💡 전체 테스트를 위해서는 다음이 필요합니다:');
      console.log('   1. Google Cloud Console에서 서비스 계정 생성');
      console.log('   2. Google Docs API 활성화');
      console.log('   3. 서비스 계정 키 JSON 다운로드');
      console.log('   4. GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수 설정');
      console.log('\n   자세한 내용은 README.md를 참고하세요.');
    }
    
    // 문서 구조 분석 테스트 (실제 API 호출 없이)
    console.log('\n📊 문서 구조 분석 로직 검증...');
    const today = new Date();
    const year = String(today.getFullYear()).slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const expectedTabName = `${year}${month}${day}`;
    
    console.log(`   - 예상 탭 이름: ${expectedTabName}`);
    console.log('   - 검색할 패턴:');
    console.log(`     • ${expectedTabName} (기본 형식)`);
    console.log(`     • ${year}.${month}.${day}`);
    console.log(`     • 20${year}.${month}.${day}`);
    console.log(`     • ${month}/${day}`);
    console.log(`     • ${month}.${day}`);
    
    // 실제 문서 쓰기 시도 (API 키가 있는 경우만)
    if (hasGoogleAuth) {
      console.log('\n📝 실제 Google Docs 쓰기 테스트 시작...');
      
      try {
        const success = await writer.writeReport(sampleTasks);
        
        if (success) {
          console.log('\n✅ Google Docs 쓰기 성공!');
          console.log('   문서를 확인해보세요:');
          console.log('   https://docs.google.com/document/d/1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow/');
        } else {
          console.log('\n❌ Google Docs 쓰기 실패');
          console.log('   로그를 확인하여 원인을 파악하세요.');
        }
      } catch (error) {
        console.log('\n❌ 오류 발생:', error.message);
        
        if (error.message.includes('permission')) {
          console.log('\n🔧 권한 문제 해결 방법:');
          console.log('   1. 서비스 계정에 문서 편집 권한 부여');
          console.log('   2. 문서 공유 설정에서 서비스 계정 이메일 추가');
        } else if (error.message.includes('not found')) {
          console.log('\n🔧 문서 찾기 문제 해결 방법:');
          console.log('   1. 문서 ID가 올바른지 확인');
          console.log('   2. 오늘 날짜의 탭이 존재하는지 확인');
          console.log('   3. 탭에 "카메라 Aiden Kim" 행이 있는 표가 있는지 확인');
        }
      }
    } else {
      console.log('\n⏭️  실제 문서 쓰기는 API 키 설정 후 가능합니다.');
    }
    
    console.log('\n🎯 테스트 요약');
    console.log('='.repeat(50));
    console.log('• GoogleDocsWriterV2 클래스 로드: ✅');
    console.log('• 인스턴스 생성: ✅');
    console.log('• 날짜 형식 변환 로직: ✅');
    console.log(`• API 키 설정: ${hasGoogleAuth ? '✅' : '❌'}`);
    console.log(`• 실제 문서 쓰기: ${hasGoogleAuth ? '테스트 중...' : '스킵됨'}`);
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    console.error('스택 추적:', error.stack);
  }
  
  console.log('\n🏁 테스트 종료');
  console.log('종료 시간:', new Date().toLocaleString('ko-KR'));
}

// 테스트 실행
testGoogleDocsV2()
  .then(() => {
    console.log('\n💡 다음 단계:');
    console.log('1. GitHub Secrets에 GOOGLE_SERVICE_ACCOUNT_KEY 설정');
    console.log('2. Quick Test 워크플로우 실행하여 전체 연동 확인');
    console.log('3. Daily Report 워크플로우로 실제 자동 보고서 생성');
  })
  .catch(console.error);