/**
 * 간략한 제목 생성 프로세스
 * 업무 내용을 바탕으로 한국어로 간결한 제목을 자동 생성
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * 업무 기반 간략한 제목 생성
 * @param {Array} tasks - 업무 목록
 * @param {string} reportType - 보고서 타입
 * @param {Object} options - 추가 옵션
 * @returns {string} 생성된 제목
 */
async function generateSimpleTitle(tasks, reportType = 'daily', options = {}) {
    console.log('📝 간략한 제목 생성 시작');
    console.log(`📋 업무 개수: ${tasks.length}개`);
    console.log(`📊 보고서 타입: ${reportType}`);
    
    if (!tasks || tasks.length === 0) {
        return generateDefaultTitle(reportType);
    }
    
    try {
        // Gemini AI로 제목 생성
        const generatedTitle = await generateAITitle(tasks, reportType, options);
        
        if (generatedTitle && generatedTitle.trim()) {
            console.log(`✅ AI 생성 제목: "${generatedTitle}"`);
            return generatedTitle.trim();
        } else {
            console.log('⚠️ AI 제목 생성 실패, 기본 제목 사용');
            return generateDefaultTitle(reportType, tasks);
        }
        
    } catch (error) {
        console.error('❌ 제목 생성 중 오류:', error.message);
        return generateDefaultTitle(reportType, tasks);
    }
}

/**
 * AI를 활용한 제목 생성
 * @param {Array} tasks - 업무 목록
 * @param {string} reportType - 보고서 타입
 * @param {Object} options - 추가 옵션
 * @returns {string} AI 생성 제목
 */
async function generateAITitle(tasks, reportType, options = {}) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // 업무 요약 생성
    const tasksSummary = tasks
        .slice(0, 5) // 최대 5개까지만 사용
        .map(task => typeof task === 'string' ? task : task.task || task.name)
        .join(', ');
    
    const reportTypeKorean = {
        'daily': '일간',
        'weekly': '주간', 
        'monthly': '월간'
    };
    
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('ko-KR');
    
    const prompt = `
다음 카메라팀 업무 내용을 바탕으로 아주 간결한 한국어 제목을 생성해주세요.

업무 내용: ${tasksSummary}
보고서 타입: ${reportTypeKorean[reportType] || '일간'}
날짜: ${dateString}

제목 생성 규칙:
1. 15자 이내로 아주 간결하게
2. 핵심 업무 1-2개만 언급
3. 전문적이고 명확한 표현
4. "~업무", "~작업", "~진행" 형태로 마무리
5. 날짜나 보고서 타입은 포함하지 않음

예시:
- "카메라 설치 및 설정 작업"
- "영상 모니터링 시스템 구축"
- "녹화 장비 점검 업무"

응답 형식: 제목만 간단히 출력 (따옴표 없이)
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        
        // 불필요한 문자 제거 및 정리
        const cleanTitle = responseText
            .replace(/["""'']/g, '') // 따옴표 제거
            .replace(/^\-\s*/, '') // 시작 부분 대시 제거
            .replace(/\.$/, '') // 끝 마침표 제거
            .trim();
        
        // 길이 제한 확인
        if (cleanTitle.length > 20) {
            return cleanTitle.substring(0, 17) + '...';
        }
        
        return cleanTitle;
        
    } catch (error) {
        console.error('AI 제목 생성 실패:', error);
        throw error;
    }
}

/**
 * 기본 제목 생성 (AI 실패 시 대체)
 * @param {string} reportType - 보고서 타입
 * @param {Array} tasks - 업무 목록 (선택사항)
 * @returns {string} 기본 제목
 */
function generateDefaultTitle(reportType, tasks = []) {
    const reportTypeKorean = {
        'daily': '일간',
        'weekly': '주간',
        'monthly': '월간'
    };
    
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    
    let baseTitle = `카메라팀 ${reportTypeKorean[reportType] || '일간'} 업무`;
    
    // 업무가 있는 경우 주요 키워드 추출
    if (tasks && tasks.length > 0) {
        const keywords = extractKeywords(tasks);
        if (keywords.length > 0) {
            baseTitle = `${keywords[0]} ${reportTypeKorean[reportType] || '일간'} 업무`;
        }
    }
    
    console.log(`🔧 기본 제목 생성: "${baseTitle}"`);
    return baseTitle;
}

/**
 * 업무에서 주요 키워드 추출
 * @param {Array} tasks - 업무 목록
 * @returns {Array} 추출된 키워드
 */
function extractKeywords(tasks) {
    const keywords = [];
    const commonKeywords = [
        '카메라', '영상', '녹화', '모니터링', '설치', '설정', 
        '점검', '구축', '시스템', '장비', '관리', '운영'
    ];
    
    const taskTexts = tasks
        .map(task => typeof task === 'string' ? task : task.task || task.name || '')
        .join(' ');
    
    for (const keyword of commonKeywords) {
        if (taskTexts.includes(keyword) && !keywords.includes(keyword)) {
            keywords.push(keyword);
        }
    }
    
    return keywords.slice(0, 2); // 최대 2개까지
}

/**
 * 제목 유효성 검사
 * @param {string} title - 검사할 제목
 * @returns {boolean} 유효성 여부
 */
function validateTitle(title) {
    if (!title || typeof title !== 'string') {
        return false;
    }
    
    const trimmed = title.trim();
    
    // 최소/최대 길이 확인
    if (trimmed.length < 3 || trimmed.length > 50) {
        return false;
    }
    
    // 특수문자 제한
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmed)) {
        return false;
    }
    
    return true;
}

/**
 * 제목 후처리 (Google Docs 호환성)
 * @param {string} title - 원본 제목
 * @returns {string} 처리된 제목
 */
function postProcessTitle(title) {
    if (!title) return '카메라팀 업무 보고';
    
    return title
        .trim()
        .replace(/\s+/g, ' ') // 연속 공백 정리
        .replace(/[<>:"/\\|?*]/g, '') // 파일명 금지 문자 제거
        .substring(0, 30); // 최대 30자 제한
}

module.exports = {
    generateSimpleTitle,
    generateAITitle,
    generateDefaultTitle,
    extractKeywords,
    validateTitle,
    postProcessTitle
};