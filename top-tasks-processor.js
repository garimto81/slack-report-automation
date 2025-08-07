/**
 * 상위 3개 업무 추출 및 핵심 내용 생성 로직
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * 상위 3개 업무 추출 및 핵심 내용 생성 메인 함수
 * @param {Array} allTasks - 모든 업무 목록
 * @param {string} reportType - 보고서 타입
 * @returns {Object} 상위 3개 업무와 핵심 내용
 */
async function processTopTasks(allTasks, reportType = 'daily') {
    console.log('🎯 상위 3개 업무 추출 및 핵심 내용 생성 시작');
    console.log(`📋 전체 업무 개수: ${allTasks.length}개`);
    
    try {
        // 1단계: 상위 3개 업무 선별
        const top3Tasks = selectTop3Tasks(allTasks);
        console.log(`✅ 상위 3개 업무 선별 완료`);
        
        // 2단계: 각 업무별 핵심 내용 생성
        const tasksWithDetails = await generateCoreContent(top3Tasks, reportType);
        console.log(`✅ 핵심 내용 생성 완료`);
        
        return {
            success: true,
            tasks: tasksWithDetails,
            totalOriginalTasks: allTasks.length,
            reportType: reportType
        };
        
    } catch (error) {
        console.error('❌ 업무 처리 중 오류:', error.message);
        
        // 에러 시에도 기본적인 3개 업무는 반환
        const fallbackTasks = allTasks.slice(0, 3).map((task, index) => ({
            priority: index + 1,
            taskName: typeof task === 'string' ? task : task.task || task.name || '업무 정보 없음',
            coreContent: '구체적인 내용 분석 중입니다.'
        }));
        
        return {
            success: false,
            tasks: fallbackTasks,
            error: error.message,
            totalOriginalTasks: allTasks.length,
            reportType: reportType
        };
    }
}

/**
 * 상위 3개 업무 선별
 * @param {Array} tasks - 모든 업무 목록
 * @returns {Array} 상위 3개 업무
 */
function selectTop3Tasks(tasks) {
    console.log('🔍 상위 3개 업무 선별 시작');
    
    if (!tasks || tasks.length === 0) {
        console.log('⚠️ 업무 목록이 비어있습니다.');
        return [];
    }
    
    // 업무 우선순위 결정 기준
    const prioritizedTasks = tasks.map((task, index) => {
        const taskText = typeof task === 'string' ? task : task.task || task.name || '';
        const priority = typeof task === 'object' && task.priority ? task.priority : 'medium';
        
        // 우선순위 점수 계산
        let score = 0;
        
        // 1. 기본 우선순위 점수
        switch(priority) {
            case 'high':
            case '높음':
                score += 30;
                break;
            case 'medium':
            case '중간':
                score += 20;
                break;
            case 'low':
            case '낮음':
                score += 10;
                break;
            default:
                score += 15;
        }
        
        // 2. 키워드 기반 가중치
        const importantKeywords = [
            '설치', '구축', '시스템', '문제', '해결', '긴급', '중요',
            '점검', '관리', '모니터링', '업그레이드', '설정'
        ];
        
        const taskTextLower = taskText.toLowerCase();
        importantKeywords.forEach(keyword => {
            if (taskTextLower.includes(keyword)) {
                score += 5;
            }
        });
        
        // 3. 업무 복잡도 점수 (길이 기반)
        if (taskText.length > 20) {
            score += 5; // 상세한 업무일 가능성
        }
        
        // 4. 순서 기반 점수 (앞선 업무에 약간의 가산점)
        score += Math.max(0, 10 - index);
        
        return {
            originalIndex: index,
            taskText,
            priority,
            score,
            originalTask: task
        };
    });
    
    // 점수 기준으로 정렬
    const sortedTasks = prioritizedTasks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // 상위 3개만
    
    console.log('📊 상위 3개 업무 선별 결과:');
    sortedTasks.forEach((task, index) => {
        console.log(`${index + 1}. [${task.score}점] ${task.taskText}`);
    });
    
    return sortedTasks;
}

/**
 * 각 업무별 핵심 내용 생성
 * @param {Array} top3Tasks - 상위 3개 업무
 * @param {string} reportType - 보고서 타입
 * @returns {Array} 핵심 내용이 포함된 업무 목록
 */
async function generateCoreContent(top3Tasks, reportType) {
    console.log('📝 핵심 내용 생성 시작');
    
    const tasksWithDetails = [];
    
    for (let i = 0; i < top3Tasks.length; i++) {
        const task = top3Tasks[i];
        console.log(`\n🔍 업무 ${i + 1} 핵심 내용 생성 중...`);
        console.log(`📋 업무명: ${task.taskText}`);
        
        try {
            const coreContent = await generateDetailedContent(task, reportType, i + 1);
            
            tasksWithDetails.push({
                priority: i + 1,
                taskName: task.taskText,
                coreContent: coreContent,
                originalPriority: task.priority,
                score: task.score
            });
            
            console.log(`✅ 업무 ${i + 1} 핵심 내용 생성 완료`);
            
        } catch (error) {
            console.error(`❌ 업무 ${i + 1} 핵심 내용 생성 실패:`, error.message);
            
            // 실패 시 기본 내용 사용
            tasksWithDetails.push({
                priority: i + 1,
                taskName: task.taskText,
                coreContent: generateFallbackContent(task.taskText),
                originalPriority: task.priority,
                score: task.score,
                error: true
            });
        }
    }
    
    return tasksWithDetails;
}

/**
 * AI를 활용한 상세 핵심 내용 생성
 * @param {Object} task - 업무 객체
 * @param {string} reportType - 보고서 타입
 * @param {number} priority - 우선순위
 * @returns {string} 생성된 핵심 내용
 */
async function generateDetailedContent(task, reportType, priority) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const reportTypeKorean = {
        'daily': '일간',
        'weekly': '주간', 
        'monthly': '월간'
    };
    
    const prompt = `
다음 카메라팀 업무에 대한 구체적이고 상세한 핵심 내용을 생성해주세요.

업무명: ${task.taskText}
보고서 타입: ${reportTypeKorean[reportType] || '일간'}
우선순위: ${priority}

핵심 내용 생성 규칙:
1. 40-80자 내외로 구체적이고 상세하게 작성
2. 해당 업무의 목적, 방법, 기대효과를 포함
3. 기술적 세부사항이나 구체적 방향성 제시
4. 카메라/영상/보안 분야의 전문성 반영
5. 실행 가능한 구체적 계획이나 접근방법 포함

좋은 예시:
- "HD 화질 개선을 위한 렌즈 교체 및 조리개 설정 최적화, 야간 촬영 성능 향상을 통한 24시간 모니터링 품질 확보"
- "AI 기반 움직임 감지 알고리즘 도입으로 오탐 최소화, 실시간 알림 시스템 구축을 통한 보안 효율성 극대화"

응답 형식: 핵심 내용만 간단히 출력 (따옴표나 부가 설명 없이)
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // 불필요한 문자 제거 및 정리
        const cleanContent = responseText
            .replace(/["""'']/g, '') // 따옴표 제거
            .replace(/^\-\s*/, '') // 시작 부분 대시 제거
            .replace(/^[\d\.\)\s]*/, '') // 번호 제거
            .trim();
        
        // 길이 제한 확인 (최대 100자)
        if (cleanContent.length > 100) {
            return cleanContent.substring(0, 97) + '...';
        }
        
        return cleanContent || generateFallbackContent(task.taskText);
        
    } catch (error) {
        console.error('AI 핵심 내용 생성 실패:', error);
        return generateFallbackContent(task.taskText);
    }
}

/**
 * 기본 핵심 내용 생성 (AI 실패 시 대체)
 * @param {string} taskText - 업무명
 * @returns {string} 기본 핵심 내용
 */
function generateFallbackContent(taskText) {
    // 키워드 기반 기본 내용 생성
    const keywordPatterns = {
        '설치': '장비 설치 및 초기 설정을 통한 시스템 구축',
        '점검': '정기적인 상태 확인 및 성능 최적화를 위한 점검 작업',
        '모니터링': '실시간 상태 감시 및 이상 상황 대응 체계 운영',
        '설정': '최적 성능 확보를 위한 파라미터 조정 및 구성 작업',
        '관리': '안정적인 운영을 위한 체계적 관리 및 유지보수',
        '업그레이드': '성능 향상 및 기능 확장을 위한 시스템 업그레이드',
        '문제': '신속한 문제 해결 및 재발 방지를 위한 근본 원인 분석',
        '카메라': '영상 품질 최적화 및 안정적인 촬영 환경 구성',
        '녹화': '고품질 영상 저장 및 효율적인 저장공간 관리',
        '시스템': '전체 시스템 안정성 확보 및 통합 관리 체계 구축'
    };
    
    // 업무명에서 키워드 찾기
    for (const [keyword, content] of Object.entries(keywordPatterns)) {
        if (taskText.includes(keyword)) {
            return content;
        }
    }
    
    // 기본 내용
    return '업무 효율성 향상 및 품질 개선을 위한 체계적 접근과 지속적 모니터링';
}

/**
 * 처리 결과 요약
 * @param {Object} result - 처리 결과
 */
function printProcessingSummary(result) {
    console.log('\n📊 업무 처리 결과 요약');
    console.log('=' .repeat(50));
    console.log(`✅ 처리 성공: ${result.success ? '예' : '아니오'}`);
    console.log(`📋 원본 업무: ${result.totalOriginalTasks}개`);
    console.log(`🎯 선별 업무: ${result.tasks.length}개`);
    
    console.log('\n📝 선별된 업무:');
    result.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.taskName}`);
        console.log(`   핵심내용: ${task.coreContent}`);
        console.log('');
    });
}

module.exports = {
    processTopTasks,
    selectTop3Tasks,
    generateCoreContent,
    generateDetailedContent,
    generateFallbackContent,
    printProcessingSummary
};