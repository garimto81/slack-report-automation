/**
 * 카메라 테이블 찾기 기능 테스트 스크립트
 */

require('dotenv').config();
const { findCameraTableInDocument, generateTodayTabName } = require('./google-docs-table-finder');

/**
 * 테스트 실행 함수
 */
async function runTableFinderTests() {
    console.log('🧪 카메라 테이블 찾기 테스트 시작');
    console.log('=' .repeat(50));
    
    // 테스트 결과 추적
    const testResults = {
        todayTabName: false,
        documentAccess: false,
        tabSearch: false,
        cameraTableSearch: false,
        overallSuccess: false
    };
    
    try {
        // 테스트 1: 오늘 날짜 탭 이름 생성
        console.log('\n📅 테스트 1: 오늘 날짜 탭 이름 생성');
        console.log('─'.repeat(30));
        
        const todayTabName = generateTodayTabName();
        console.log(`✅ 생성된 탭 이름: ${todayTabName}`);
        
        // 다양한 날짜 테스트
        const testDates = [
            new Date('2025-08-02'),
            new Date('2025-08-06'),
            new Date('2025-12-25')
        ];
        
        console.log('\n📋 다양한 날짜 테스트:');
        testDates.forEach(date => {
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const expected = `${year}${month}${day}`;
            
            console.log(`${date.toLocaleDateString('ko-KR')} → ${expected}`);
        });
        
        testResults.todayTabName = true;
        
        // 테스트 2: 구글 문서 접근 및 카메라 테이블 찾기
        if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            console.log('\n🔍 테스트 2: 구글 문서에서 카메라 테이블 찾기');
            console.log('─'.repeat(30));
            
            const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
            console.log(`📄 문서 ID: ${documentId}`);
            
            const findResult = await findCameraTableInDocument(documentId);
            
            if (findResult.success) {
                console.log('✅ 카메라 테이블 찾기 성공!');
                console.log(`📑 발견된 탭: "${findResult.tab.title}"`);
                console.log(`📊 카메라 헤더 위치: 행 ${findResult.table.cameraRowIndex + 1}`);
                
                // 헤더 구조 상세 출력
                console.log('\n📋 테이블 헤더 구조:');
                const headers = findResult.table.headerStructure.headers || [];
                headers.forEach((header, index) => {
                    console.log(`  ${index + 1}. "${header}"`);
                });
                
                console.log('\n🎯 중요 컬럼 위치:');
                const headerMap = findResult.table.headerStructure.headerMap || {};
                Object.entries(headerMap).forEach(([key, value]) => {
                    console.log(`  ${key}: 컬럼 ${value + 1}`);
                });
                
                testResults.documentAccess = true;
                testResults.tabSearch = true;
                testResults.cameraTableSearch = true;
                
            } else {
                console.log('❌ 카메라 테이블 찾기 실패');
                console.log(`오류: ${findResult.message}`);
                
                if (findResult.availableTabs) {
                    console.log('\n📋 사용 가능한 탭 목록:');
                    findResult.availableTabs.forEach((tab, index) => {
                        console.log(`  ${index + 1}. "${tab.title}"`);
                        
                        // 오늘 날짜 패턴 확인
                        if (tab.title.includes(todayTabName)) {
                            console.log(`      ✅ 오늘 날짜 패턴 일치!`);
                        }
                    });
                }
                
                testResults.documentAccess = true;
                // tabSearch와 cameraTableSearch는 실패로 유지
            }
            
        } else {
            console.log('\n⚠️ 테스트 2 건너뛰기: GOOGLE_SERVICE_ACCOUNT_KEY 없음');
            console.log('환경 변수를 설정하면 실제 문서 테스트가 가능합니다.');
        }
        
        // 테스트 3: 날짜 패턴 매칭 테스트
        console.log('\n🔍 테스트 3: 날짜 패턴 매칭 테스트');
        console.log('─'.repeat(30));
        
        const mockTabTitles = [
            '카메라팀 업무 250802',
            '2025년 08월 06일 업무 현황 250806',
            '일일 업무 보고 250807',
            '주간 업무 정리',
            '기타 문서'
        ];
        
        console.log(`찾을 패턴: "${todayTabName}"`);
        console.log('\n📋 목 탭 제목 매칭 테스트:');
        
        mockTabTitles.forEach(title => {
            const matches = title.includes(todayTabName);
            console.log(`${matches ? '✅' : '❌'} "${title}" → ${matches ? '일치' : '불일치'}`);
        });
        
        // 전체 결과 평가
        const successCount = Object.values(testResults).filter(Boolean).length - 1; // overallSuccess 제외
        testResults.overallSuccess = successCount >= 3; // 최소 3개 이상 성공
        
        console.log('\n🎯 테스트 결과 요약');
        console.log('=' .repeat(50));
        console.log(`📅 날짜 탭 이름 생성: ${testResults.todayTabName ? '✅' : '❌'}`);
        console.log(`📄 구글 문서 접근: ${testResults.documentAccess ? '✅' : '❌'}`);  
        console.log(`📑 탭 검색: ${testResults.tabSearch ? '✅' : '❌'}`);
        console.log(`📊 카메라 테이블 찾기: ${testResults.cameraTableSearch ? '✅' : '❌'}`);
        console.log(`🎉 전체 성공: ${testResults.overallSuccess ? '✅' : '❌'} (${successCount}/4)`);
        
        if (testResults.overallSuccess) {
            console.log('\n🚀 테스트 성공! 카메라 테이블 업데이트 준비 완료');
            console.log('\n💡 다음 단계:');
            console.log('1. node update-camera-table.js --test  # 안전한 테스트');
            console.log('2. node update-camera-table.js daily   # 실제 업데이트');
        } else {
            console.log('\n⚠️ 일부 테스트 실패. 환경 설정을 확인해주세요.');
        }
        
    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
        testResults.overallSuccess = false;
    }
    
    return testResults;
}

/**
 * 환경 변수 체크
 */
function checkEnvironment() {
    console.log('🔧 환경 변수 확인');
    console.log('─'.repeat(20));
    
    const envVars = {
        'GOOGLE_SERVICE_ACCOUNT_KEY': '구글 서비스 계정 키 (필수)',
        'SLACK_BOT_TOKEN': 'Slack 봇 토큰 (업무 데이터용)',
        'GEMINI_API_KEY': 'Gemini AI API 키 (내용 생성용)'
    };
    
    Object.entries(envVars).forEach(([key, description]) => {
        const exists = !!process.env[key];
        console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? '설정됨' : '미설정'}`);
    });
    
    console.log('');
}

/**
 * 스크립트 직접 실행 시
 */
if (require.main === module) {
    async function main() {
        checkEnvironment();
        const results = await runTableFinderTests();
        process.exit(results.overallSuccess ? 0 : 1);
    }
    
    main().catch(console.error);
}

module.exports = { runTableFinderTests, checkEnvironment };