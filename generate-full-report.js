/**
 * Slack DM용 전체 업무 보고서 생성 스크립트
 * 모든 카메라 파트 업무를 보고하되, 상위 3개를 별도 표시
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
 * AI를 사용한 업무 분석 - 그룹화 포함
 */
async function analyzeWithAI(messages) {
    console.log('🤖 AI 업무 분석 중 (그룹화 적용)...');
    
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
다음 Slack 대화를 분석하여 카메라 파트 업무를 추출하고, 동일 목적의 업무는 하나로 통합하세요.

대화 내용:
${messageText.substring(0, 8000)}

JSON 형식:
{
  "cameraTasks": [
    {
      "task": "목적/의도가 명확한 통합 업무명 (15-25자)",
      "mergedSummary": "핵심작업1/핵심작업2", // 통합 내용 초간단 요약 (15자 이내)
      "originalCount": 2, // 원래 몇 개의 업무를 통합했는지
      "priority": 1-10 (1이 가장 높음)
    }
  ]
}

업무 통합 규칙:
1. 동일한 목적/프로젝트를 위한 업무는 하나로 통합
2. 통합 시 대표 업무명으로 표현
3. mergedSummary에는 통합된 핵심 작업들을 "/" 구분하여 간단히 기록

통합 예시:
원본 업무들: "포커 시연 카메라 설치", "포커 시연 SD카드 녹화", "포커 시연 오디오 세팅"
✅ task: "포커 시연회 준비 작업"
✅ mergedSummary: "카메라/SD녹화/오디오"
✅ originalCount: 3

업무명 작성 원칙:
1. 목적/의도가 명확해야 함
2. 15-25자 범위
3. 중복되는 수식어 제거

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
            console.log(`   ✅ ${analysis.cameraTasks?.length || 0}개 업무 추출`);
            return analysis;
        }
    } catch (error) {
        console.error('   ❌ AI 분석 실패:', error.message);
    }
    
    return { cameraTasks: [] };
}

/**
 * Slack DM 보고서 생성 및 전송 - 극도로 간소화된 버전
 */
async function sendFullReport(userId, analysis, reportType = 'daily') {
    if (!analysis.cameraTasks || analysis.cameraTasks.length === 0) {
        console.log('보고할 업무가 없습니다');
        return;
    }
    
    // 우선순위 정렬
    const sortedTasks = [...analysis.cameraTasks].sort((a, b) => a.priority - b.priority);
    
    // 보고서 타입별 제목
    const reportTitles = {
        'daily': '카메라 파트 일간 업무 보고서',
        'weekly': '카메라 파트 주간 업무 보고서',
        'monthly': '카메라 파트 월간 업무 보고서'
    };
    
    // 극도로 간소화된 메시지 생성 (진행률 제거)
    let simpleMessage = `${reportTitles[reportType]}\n`;
    
    // 업무 리스트 (목적/의도 중심, 진행률 없이)
    sortedTasks.forEach((task, idx) => {
        const prefix = idx < 3 ? '★' : '-';
        
        // 통합된 업무인 경우 mergedSummary를 괄호로 표시
        if (task.originalCount > 1 && task.mergedSummary) {
            simpleMessage += `${prefix} ${task.task} (${task.mergedSummary})\n`;
        } else {
            simpleMessage += `${prefix} ${task.task}\n`;
        }
    });
    
    // Slack 블록 (조금 더 포맷팅된 버전이지만 여전히 간단)
    const blocks = [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*${reportTitles[reportType]}*`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: sortedTasks.map((task, idx) => {
                    const prefix = idx < 3 ? '★' : '-';
                    // 통합된 업무인 경우 mergedSummary를 괄호로 표시
                    if (task.originalCount > 1 && task.mergedSummary) {
                        return `${prefix} ${task.task} (${task.mergedSummary})`;
                    } else {
                        return `${prefix} ${task.task}`;
                    }
                }).join('\n')
            }
        }
    ];
    
    try {
        // DM 채널 열기
        const dmChannel = await slack.conversations.open({
            users: userId
        });
        
        // 메시지 전송
        await slack.chat.postMessage({
            channel: dmChannel.channel.id,
            text: simpleMessage,
            blocks: blocks
        });
        
        console.log(`✅ ${userId}님께 간소화된 보고서 전송 완료`);
        
    } catch (error) {
        console.error(`❌ DM 전송 실패:`, error.message);
    }
}

// 헬퍼 함수들
function calculateAverageProgress(tasks) {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, task) => {
        const progress = parseInt(task.progress) || 0;
        return sum + progress;
    }, 0);
    return Math.round(total / tasks.length);
}

function countTodayDeadlines(tasks) {
    const today = new Date().toLocaleDateString('ko-KR');
    return tasks.filter(task => {
        if (!task.deadline) return false;
        return task.deadline.includes('오늘') || task.deadline.includes(today);
    }).length;
}

function countByCategory(tasks, category) {
    return tasks.filter(task => task.category === category).length;
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('\n========================================');
    console.log('   📸 전체 업무 보고서 생성 시스템');
    console.log('========================================\n');
    
    const channelId = process.env.SLACK_CHANNEL_ID;
    const userIds = process.env.SLACK_DM_USER_IDS?.split(',') || [];
    
    if (!channelId || !userIds.length) {
        console.error('❌ 환경 변수 설정 필요');
        process.exit(1);
    }
    
    // 보고서 타입 결정 (일간/주간/월간)
    const reportType = process.argv[2] || 'daily'; // 기본값: daily
    
    // 보고서 타입에 따른 기간 설정
    const hours = reportType === 'weekly' ? 168 : reportType === 'monthly' ? 720 : 24;
    
    // 메시지 수집
    const messages = await fetchChannelMessages(channelId, hours);
    
    if (messages.length === 0) {
        console.log('분석할 메시지가 없습니다');
        process.exit(0);
    }
    
    // AI 분석
    const analysis = await analyzeWithAI(messages);
    
    // 각 사용자에게 전체 보고서 전송
    console.log('\n📤 보고서 전송 중...');
    for (const userId of userIds) {
        await sendFullReport(userId, analysis, reportType);
        await new Promise(resolve => setTimeout(resolve, 1000)); // API 제한 방지
    }
    
    console.log('\n✅ 전체 업무 보고 완료!');
    console.log(`   - 총 업무: ${analysis.cameraTasks?.length || 0}개`);
    console.log(`   - 수신자: ${userIds.length}명`);
}

// 실행
main().catch(error => {
    console.error('💥 오류:', error);
    process.exit(1);
});