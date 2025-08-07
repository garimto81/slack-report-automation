/**
 * 실제 Slack 메시지를 분석하여 간소화된 보고서 출력
 * 화면 출력 전용 (DM 전송 없음)
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
    console.log(`\n📡 Slack 메시지 수집 중... (최근 ${hours}시간)`);
    
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
            console.log('   메시지가 없습니다');
            return [];
        }
        
        // 사용자 정보 가져오기
        const userMap = new Map();
        const messages = [];
        
        for (const msg of result.messages) {
            if (!msg.user || !msg.text) continue;
            
            // 사용자 이름 가져오기
            if (!userMap.has(msg.user)) {
                try {
                    const userInfo = await slack.users.info({ user: msg.user });
                    userMap.set(msg.user, userInfo.user.real_name || userInfo.user.name || msg.user);
                } catch (e) {
                    userMap.set(msg.user, msg.user);
                }
            }
            
            messages.push({
                user: userMap.get(msg.user),
                text: msg.text,
                timestamp: new Date(parseFloat(msg.ts) * 1000)
            });
        }
        
        console.log(`   ✅ ${messages.length}개 메시지 수집 완료\n`);
        
        // 수집된 메시지 미리보기
        console.log('📄 수집된 메시지:');
        console.log('─'.repeat(60));
        messages.slice(0, 5).forEach(msg => {
            const time = msg.timestamp.toLocaleString('ko-KR', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            console.log(`[${time}] ${msg.user}: ${msg.text.substring(0, 50)}...`);
        });
        if (messages.length > 5) {
            console.log(`... 외 ${messages.length - 5}개 메시지`);
        }
        console.log('─'.repeat(60));
        
        return messages;
        
    } catch (error) {
        console.error('❌ 메시지 수집 실패:', error.message);
        return [];
    }
}

/**
 * AI를 사용한 업무 분석
 */
async function analyzeWithAI(messages) {
    console.log('\n🤖 AI 업무 분석 중...');
    
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
다음 Slack 대화를 분석하여 카메라 파트의 실제 업무를 추출하세요.
각 업무는 극도로 간결하게 표현하되, 목적과 행동이 명확해야 합니다.

대화 내용:
${messageText.substring(0, 8000)}

JSON 형식으로 응답:
{
  "cameraTasks": [
    {
      "task": "간결한 업무명 (15자 이내, 목적+행동)",
      "progress": "진행률% (숫자만)",
      "priority": 1-10 (1이 가장 높음)
    }
  ]
}

업무 추출 원칙:
1. 실제로 진행 중이거나 계획된 업무만 추출
2. 단순 대화나 질문은 제외
3. 카메라 파트 관련 업무만 (촬영, 편집, 장비, 라이브, 기획)
4. 업무명은 15자 이내로 극도로 간결하게
5. "~를 위한", "~에 대한" 같은 수식어 제거
6. 핵심 동사와 목적어만 사용

예시:
좋은 예: "포커 시연 카메라 설치", "영상 편집 완료", "장비 점검 진행"
나쁜 예: "NSUS GFX 개발팀을 위한 포커 프로덕션 시연용 카메라 시스템 설치"
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`   ✅ ${analysis.cameraTasks?.length || 0}개 업무 추출 완료\n`);
            return analysis;
        }
    } catch (error) {
        console.error('   ❌ AI 분석 실패:', error.message);
    }
    
    return { cameraTasks: [] };
}

/**
 * 간소화된 보고서 출력
 */
function displaySimpleReport(analysis, reportType = 'daily') {
    const reportTitles = {
        'daily': '카메라 파트 일간 업무 보고서',
        'weekly': '카메라 파트 주간 업무 보고서',
        'monthly': '카메라 파트 월간 업무 보고서'
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📸 실제 Slack 메시지 기반 보고서');
    console.log('='.repeat(60));
    
    if (!analysis.cameraTasks || analysis.cameraTasks.length === 0) {
        console.log('\n보고할 업무가 없습니다.\n');
        return;
    }
    
    // 우선순위 정렬
    const sortedTasks = [...analysis.cameraTasks].sort((a, b) => a.priority - b.priority);
    
    // 보고서 출력
    console.log(`\n${reportTitles[reportType]}`);
    sortedTasks.forEach((task, idx) => {
        const prefix = idx < 3 ? '★' : '-';
        const progress = task.progress || '0';
        console.log(`${prefix} ${task.task} (${progress}%)`);
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log('💡 이 메시지가 실제로 Slack DM으로 전송됩니다.');
    console.log('─'.repeat(60));
    
    // 통계
    console.log('\n📊 분석 통계:');
    console.log(`   • 총 업무: ${sortedTasks.length}개`);
    console.log(`   • 우선순위 TOP 3: ${sortedTasks.slice(0, 3).map(t => t.task).join(', ')}`);
    const avgProgress = Math.round(
        sortedTasks.reduce((sum, t) => sum + (parseInt(t.progress) || 0), 0) / sortedTasks.length
    );
    console.log(`   • 평균 진행률: ${avgProgress}%`);
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       실제 Slack 메시지 분석 및 보고서 생성 시스템       ║');
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
        console.log('\n분석할 메시지가 없습니다');
        process.exit(0);
    }
    
    // AI 분석
    const analysis = await analyzeWithAI(messages);
    
    // 간소화된 보고서 출력
    displaySimpleReport(analysis, reportType);
    
    console.log('\n✅ 분석 완료\n');
}

// 실행
main().catch(error => {
    console.error('💥 오류:', error);
    process.exit(1);
});