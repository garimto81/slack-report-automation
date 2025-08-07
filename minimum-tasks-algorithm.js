/**
 * 최소 3개 업무 확보 알고리즘
 * 일간 업무가 3개 미만이면 자동으로 주간 보고를 실행하여 업무 확보
 */

const { generateSlackReport } = require('./generate-full-report');

/**
 * 최소 업무 개수 확보 함수
 * @param {string} initialReportType - 초기 보고서 타입 ('daily', 'weekly', 'monthly')
 * @param {number} minTaskCount - 최소 필요 업무 개수 (기본값: 3)
 * @returns {Object} 최종 업무 리스트와 사용된 보고서 타입
 */
async function ensureMinimumTasks(initialReportType = 'daily', minTaskCount = 3) {
    console.log(`🎯 최소 ${minTaskCount}개 업무 확보 알고리즘 시작`);
    console.log(`📋 초기 보고서 타입: ${initialReportType}`);
    
    let currentReportType = initialReportType;
    let tasks = [];
    let attempts = 0;
    const maxAttempts = 3; // daily -> weekly -> monthly 최대 3번 시도
    
    // 보고서 타입별 우선순위 (확장 순서)
    const reportTypeSequence = {
        'daily': ['daily', 'weekly', 'monthly'],
        'weekly': ['weekly', 'monthly'],
        'monthly': ['monthly']
    };
    
    const sequence = reportTypeSequence[initialReportType] || ['daily', 'weekly', 'monthly'];
    
    for (const reportType of sequence) {
        attempts++;
        console.log(`\n🔍 시도 ${attempts}: ${reportType} 보고서로 업무 수집`);
        
        try {
            // 실제 Slack 채널에서 데이터 수집 (기존 로직 활용)
            const reportData = await collectSlackData(reportType);
            tasks = reportData.tasks || [];
            
            console.log(`📊 수집된 업무 개수: ${tasks.length}개`);
            
            if (tasks.length >= minTaskCount) {
                console.log(`✅ 최소 업무 개수 달성! (${tasks.length}개 >= ${minTaskCount}개)`);
                return {
                    tasks: tasks,
                    reportType: reportType,
                    tasksCount: tasks.length,
                    expandedFrom: initialReportType !== reportType ? initialReportType : null
                };
            } else {
                console.log(`⚠️ 업무 개수 부족 (${tasks.length}개 < ${minTaskCount}개) - 다음 단계로 확장`);
            }
            
        } catch (error) {
            console.error(`❌ ${reportType} 보고서 수집 실패:`, error.message);
            continue;
        }
    }
    
    // 모든 시도 실패 시
    console.log(`⚠️ 모든 시도 완료. 최종 업무 개수: ${tasks.length}개`);
    return {
        tasks: tasks,
        reportType: currentReportType,
        tasksCount: tasks.length,
        expandedFrom: initialReportType,
        warning: `최소 ${minTaskCount}개 업무를 확보하지 못했습니다.`
    };
}

/**
 * Slack 데이터 수집 함수 (기존 로직 활용)
 * @param {string} reportType - 보고서 타입
 * @returns {Object} 수집된 데이터
 */
async function collectSlackData(reportType) {
    // 기존 generate-full-report.js의 로직을 활용
    // 실제 Slack API 호출 및 Gemini 분석 수행
    
    const { WebClient } = require('@slack/web-api');
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 날짜 범위 계산
    const dateRange = calculateDateRange(reportType);
    console.log(`📅 데이터 수집 범위: ${dateRange.start} ~ ${dateRange.end}`);
    
    try {
        // Slack 메시지 수집
        const messages = await fetchSlackMessages(slack, dateRange);
        console.log(`💬 수집된 메시지: ${messages.length}개`);
        
        if (messages.length === 0) {
            return { tasks: [], messageCount: 0 };
        }
        
        // Gemini AI로 업무 분석
        const tasks = await analyzeTasksWithGemini(genAI, messages, reportType);
        console.log(`📋 분석된 업무: ${tasks.length}개`);
        
        return {
            tasks: tasks,
            messageCount: messages.length,
            dateRange: dateRange
        };
        
    } catch (error) {
        console.error(`❌ ${reportType} 데이터 수집 중 오류:`, error.message);
        return { tasks: [], messageCount: 0, error: error.message };
    }
}

/**
 * 날짜 범위 계산
 * @param {string} reportType - 보고서 타입
 * @returns {Object} 시작일과 종료일
 */
function calculateDateRange(reportType) {
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // KST 변환
    
    let daysBack;
    switch (reportType) {
        case 'daily':
            daysBack = 1;
            break;
        case 'weekly':
            daysBack = 7;
            break;
        case 'monthly':
            daysBack = 30;
            break;
        default:
            daysBack = 1;
    }
    
    const startDate = new Date(kstNow);
    startDate.setDate(startDate.getDate() - daysBack);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: kstNow.toISOString().split('T')[0],
        daysBack: daysBack
    };
}

/**
 * Slack 메시지 수집
 * @param {WebClient} slack - Slack 클라이언트
 * @param {Object} dateRange - 날짜 범위
 * @returns {Array} 메시지 배열
 */
async function fetchSlackMessages(slack, dateRange) {
    const channelId = process.env.SLACK_CHANNEL_ID;
    
    const startTimestamp = Math.floor(new Date(dateRange.start).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(dateRange.end).getTime() / 1000);
    
    try {
        const result = await slack.conversations.history({
            channel: channelId,
            oldest: startTimestamp.toString(),
            latest: endTimestamp.toString(),
            limit: 1000
        });
        
        return result.messages || [];
        
    } catch (error) {
        console.error('Slack 메시지 수집 오류:', error);
        return [];
    }
}

/**
 * Gemini AI로 업무 분석
 * @param {GoogleGenerativeAI} genAI - Gemini AI 인스턴스
 * @param {Array} messages - Slack 메시지들
 * @param {string} reportType - 보고서 타입
 * @returns {Array} 분석된 업무 목록
 */
async function analyzeTasksWithGemini(genAI, messages, reportType) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const messagesText = messages
            .filter(msg => msg.text && msg.text.trim().length > 0)
            .map(msg => msg.text)
            .join('\n');
        
        if (!messagesText.trim()) {
            return [];
        }
        
        const prompt = `
다음 Slack 메시지들을 분석하여 카메라 관련 업무를 추출해주세요.

메시지 내용:
${messagesText}

분석 요청사항:
1. 카메라, 영상, 녹화, 모니터링, 설치, 설정 관련 업무만 추출
2. 각 업무는 목적과 의도가 명확해야 함
3. 중복되거나 유사한 업무는 통합
4. 업무명은 간결하지만 구체적으로 작성

응답 형식 (JSON):
{
  "tasks": [
    {
      "task": "업무명",
      "category": "카테고리",
      "priority": "high/medium/low"
    }
  ]
}
`;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // JSON 파싱 시도
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed.tasks || [];
            }
        } catch (parseError) {
            console.error('Gemini 응답 파싱 오류:', parseError);
        }
        
        return [];
        
    } catch (error) {
        console.error('Gemini 분석 오류:', error);
        return [];
    }
}

module.exports = {
    ensureMinimumTasks,
    collectSlackData,
    calculateDateRange
};