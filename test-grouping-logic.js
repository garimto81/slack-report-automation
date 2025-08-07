/**
 * 동일 목적 업무 그룹화 테스트 스크립트
 * Slack 전송 없이 콘솔에서만 테스트
 */

require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Slack 및 Gemini 클라이언트 초기화
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Slack 채널에서 메시지 수집
 */
async function fetchChannelMessages(channelId, hours = 24) {
    const period = hours >= 720 ? '30일' : hours >= 168 ? '7일' : '24시간';
    console.log(`📡 Slack 메시지 수집 중... (최근 ${period})`);
    
    const now = new Date();
    const since = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const oldest = Math.floor(since.getTime() / 1000).toString();
    
    try {
        const result = await slack.conversations.history({
            channel: channelId,
            oldest: oldest,
            limit: 100
        });
        
        if (!result.messages || result.messages.length === 0) {
            return [];
        }
        
        const messages = [];
        for (const msg of result.messages) {
            if (msg.user && msg.text) {
                messages.push({
                    user: msg.user,
                    text: msg.text,
                    timestamp: new Date(parseFloat(msg.ts) * 1000)
                });
            }
        }
        
        console.log(`   ✅ ${messages.length}개 메시지 수집 완료`);
        return messages;
        
    } catch (error) {
        console.error('❌ 메시지 수집 실패:', error.message);
        return [];
    }
}

/**
 * AI를 사용한 업무 분석 - 그룹화 로직 포함
 */
async function analyzeWithGrouping(messages) {
    console.log('🤖 AI 업무 분석 중 (그룹화 로직 적용)...');
    
    const messageText = messages.map(msg => {
        const time = msg.timestamp.toLocaleString('ko-KR', { 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `[${time}] ${msg.user}: ${msg.text}`;
    }).join('\n');
    
    const prompt = `
다음 Slack 대화를 분석하여 카메라 파트의 업무를 추출하고, 동일 목적의 업무는 하나로 통합하세요.

대화 내용:
${messageText.substring(0, 8000)}

JSON 형식:
{
  "cameraTasks": [
    {
      "task": "목적/의도가 명확한 통합 업무명 (15-25자)",
      "subTasks": ["세부 작업1", "세부 작업2"], // 통합된 세부 작업들
      "mergedSummary": "핵심작업1/핵심작업2", // 통합 내용 초간단 요약 (15자 이내)
      "originalCount": 2, // 원래 몇 개의 업무를 통합했는지
      "priority": 1-10 (1이 가장 높음)
    }
  ]
}

업무 통합 규칙:
1. 동일한 목적/프로젝트를 위한 업무는 하나로 통합
2. 통합 시 대표 업무명으로 표현하고 세부 작업은 subTasks에 기록
3. 사소한 세부 작업들은 큰 목적 아래 묶기

통합 예시:
원본 업무들:
- "원격 프로덕션 시연회 위한 카메라 영상 싱크 맞추기"
- "원격 프로덕션 시연회 위한 카메라 소스 SD카드 녹화"
- "원격 프로덕션 시연회 위한 오디오 세팅"

통합 결과:
✅ task: "원격 프로덕션 시연회 준비 작업"
✅ subTasks: ["카메라 영상 싱크", "SD카드 녹화 세팅", "오디오 시스템 구성"]
✅ mergedSummary: "영상싱크/SD녹화/오디오"
✅ originalCount: 3

업무명 작성 원칙:
1. 목적/의도가 명확해야 함
2. 15-25자 범위
3. 중복되는 수식어 제거
4. 대표성 있는 명칭 사용

mergedSummary 작성 원칙:
1. 핵심 키워드만 추출
2. 슬래시(/)로 구분
3. 15자 이내로 압축
4. 명사 위주로 작성

카메라 파트 업무 판별:
- 촬영 (드론, 카메라, 스튜디오)
- 편집 (색보정, 자막, 렌더링)
- 라이브 스트리밍/중계
- 장비 관리
- 미디어 자산 관리
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`   ✅ ${analysis.cameraTasks?.length || 0}개 통합 업무로 정리 완료`);
            
            // 통합 통계 출력
            const totalOriginal = analysis.cameraTasks?.reduce((sum, task) => 
                sum + (task.originalCount || 1), 0) || 0;
            if (totalOriginal > analysis.cameraTasks?.length) {
                console.log(`   📊 ${totalOriginal}개 업무 → ${analysis.cameraTasks.length}개로 통합`);
            }
            
            return analysis;
        }
    } catch (error) {
        console.error('   ❌ AI 분석 실패:', error.message);
    }
    
    return { cameraTasks: [] };
}

/**
 * 그룹화된 결과 출력 (콘솔 전용)
 */
function displayGroupedResults(analysis, reportType = 'daily') {
    const reportTitles = {
        'daily': '카메라 파트 일간 업무 보고서',
        'weekly': '카메라 파트 주간 업무 보고서',
        'monthly': '카메라 파트 월간 업무 보고서'
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 그룹화된 업무 보고서 (테스트)');
    console.log('='.repeat(60));
    
    if (!analysis.cameraTasks || analysis.cameraTasks.length === 0) {
        console.log('\n보고할 업무가 없습니다.\n');
        return;
    }
    
    // 우선순위 정렬
    const sortedTasks = [...analysis.cameraTasks].sort((a, b) => a.priority - b.priority);
    
    // 간소화된 보고서 출력
    console.log(`\n${reportTitles[reportType]}`);
    sortedTasks.forEach((task, idx) => {
        const prefix = idx < 3 ? '★' : '-';
        
        // 통합된 업무인 경우 mergedSummary를 괄호로 표시
        if (task.originalCount > 1 && task.mergedSummary) {
            console.log(`${prefix} ${task.task} (${task.mergedSummary})`);
        } else {
            console.log(`${prefix} ${task.task}`);
        }
    });
    
    // 상세 정보 출력
    console.log('\n' + '-'.repeat(60));
    console.log('📋 상세 업무 분석');
    console.log('-'.repeat(60));
    
    sortedTasks.forEach((task, idx) => {
        console.log(`\n${idx + 1}. ${task.task}`);
        if (task.subTasks && task.subTasks.length > 0) {
            console.log('   통합된 세부 작업:');
            task.subTasks.forEach(sub => {
                console.log(`   • ${sub}`);
            });
        }
        if (task.originalCount > 1) {
            console.log(`   → ${task.originalCount}개 업무를 1개로 통합`);
        }
    });
    
    // 통계
    const totalOriginal = sortedTasks.reduce((sum, task) => 
        sum + (task.originalCount || 1), 0);
    
    console.log('\n' + '-'.repeat(60));
    console.log('📊 통합 효과:');
    console.log(`   • 원본 업무: ${totalOriginal}개`);
    console.log(`   • 통합 후: ${sortedTasks.length}개`);
    console.log(`   • 감소율: ${Math.round((1 - sortedTasks.length/totalOriginal) * 100)}%`);
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║         업무 그룹화 테스트 (Slack 전송 없음)            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    
    const channelId = process.env.SLACK_CHANNEL_ID;
    
    if (!channelId || channelId === 'C-your-channel-id') {
        console.error('\n❌ 오류: SLACK_CHANNEL_ID가 설정되지 않았습니다');
        process.exit(1);
    }
    
    // 보고서 타입 (기본: daily)
    const reportType = process.argv[2] || 'daily';
    const hours = reportType === 'weekly' ? 168 : reportType === 'monthly' ? 720 : 24;
    
    // 메시지 수집
    const messages = await fetchChannelMessages(channelId, hours);
    
    if (messages.length === 0) {
        console.log('분석할 메시지가 없습니다');
        process.exit(0);
    }
    
    // AI 분석 (그룹화 포함)
    const analysis = await analyzeWithGrouping(messages);
    
    // 그룹화된 결과 출력
    displayGroupedResults(analysis, reportType);
    
    console.log('\n✅ 테스트 완료 (Slack 전송 없음)\n');
}

// 실행
main().catch(error => {
    console.error('💥 오류:', error);
    process.exit(1);
});