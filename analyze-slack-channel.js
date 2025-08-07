/**
 * Slack 채널 메시지 AI 분석 스크립트
 * 실제 채널 메시지를 수집하고 AI로 업무를 추론합니다
 */

require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Slack 및 Gemini 클라이언트 초기화
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 색상 코드 (콘솔 출력용)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

/**
 * Slack 채널에서 메시지 수집
 */
async function fetchChannelMessages(channelId, hours = 24) {
    console.log(`\n${colors.cyan}📡 Slack 채널 메시지 수집 중...${colors.reset}`);
    console.log(`   채널 ID: ${channelId}`);
    console.log(`   수집 기간: 최근 ${hours}시간`);
    
    const now = new Date();
    const since = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const oldest = Math.floor(since.getTime() / 1000).toString();
    
    try {
        // 채널 정보 가져오기
        const channelInfo = await slack.conversations.info({
            channel: channelId
        });
        console.log(`   채널명: #${channelInfo.channel.name}`);
        
        // 메시지 가져오기
        const result = await slack.conversations.history({
            channel: channelId,
            oldest: oldest,
            limit: 100
        });
        
        if (!result.messages || result.messages.length === 0) {
            console.log(`${colors.yellow}   ⚠️ 메시지가 없습니다${colors.reset}`);
            return [];
        }
        
        // 사용자 정보 매핑
        const userMap = new Map();
        const messages = [];
        
        for (const msg of result.messages) {
            if (!msg.user) continue;
            
            // 사용자 이름 가져오기 (캐싱)
            if (!userMap.has(msg.user)) {
                try {
                    const userInfo = await slack.users.info({ user: msg.user });
                    userMap.set(msg.user, userInfo.user.real_name || userInfo.user.name);
                } catch (e) {
                    userMap.set(msg.user, msg.user);
                }
            }
            
            messages.push({
                user: userMap.get(msg.user),
                text: msg.text || '',
                timestamp: new Date(parseFloat(msg.ts) * 1000),
                thread_ts: msg.thread_ts,
                reply_count: msg.reply_count || 0
            });
            
            // 쓰레드 답글도 가져오기
            if (msg.thread_ts && msg.reply_count > 0) {
                try {
                    const threadResult = await slack.conversations.replies({
                        channel: channelId,
                        ts: msg.thread_ts,
                        limit: 20
                    });
                    
                    if (threadResult.messages && threadResult.messages.length > 1) {
                        // 첫 메시지는 이미 포함되어 있으므로 제외
                        for (const reply of threadResult.messages.slice(1)) {
                            if (!reply.user) continue;
                            
                            if (!userMap.has(reply.user)) {
                                try {
                                    const userInfo = await slack.users.info({ user: reply.user });
                                    userMap.set(reply.user, userInfo.user.real_name || userInfo.user.name);
                                } catch (e) {
                                    userMap.set(reply.user, reply.user);
                                }
                            }
                            
                            messages.push({
                                user: userMap.get(reply.user),
                                text: '  └─ ' + (reply.text || ''),
                                timestamp: new Date(parseFloat(reply.ts) * 1000),
                                is_thread_reply: true
                            });
                        }
                    }
                } catch (e) {
                    console.log(`   쓰레드 읽기 실패: ${e.message}`);
                }
            }
        }
        
        console.log(`${colors.green}   ✅ 총 ${messages.length}개 메시지 수집 완료${colors.reset}`);
        return messages;
        
    } catch (error) {
        console.error(`${colors.red}❌ 메시지 수집 실패:${colors.reset}`, error.message);
        return [];
    }
}

/**
 * AI를 사용한 업무 분석
 */
async function analyzeWithAI(messages) {
    console.log(`\n${colors.magenta}🤖 AI 업무 분석 시작...${colors.reset}`);
    
    if (messages.length === 0) {
        console.log('   분석할 메시지가 없습니다');
        return null;
    }
    
    // 메시지를 텍스트로 변환
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
다음은 Slack 채널의 최근 대화 내용입니다. 
이 대화를 분석하여 카메라 파트와 관련된 업무를 추출하고, 카메라 파트가 아닌 업무도 구분해주세요.

대화 내용:
${messageText.substring(0, 8000)}

다음 형식의 JSON으로 응답해주세요:
{
  "cameraTasksList": [
    {
      "task": "한줄 업무 요약 (목적+행동, 20자 이내)",
      "oneLiner": "보고서용 초간단 한줄 설명 (15자 이내)",
      "purpose": "이 업무의 목적/의도 (왜 필요한가?)",
      "context": "업무 배경/상황 설명",
      "details": "구체적 실행 내용 (어떻게?)",
      "expectedResult": "기대 결과/목표",
      "assignee": "담당자",
      "priority": 1-5 (1이 가장 높음),
      "deadline": "마감일/시간",
      "progress": "진행률 % 또는 상태",
      "category": "촬영/편집/장비/라이브/기획",
      "reasoning": "카메라 파트 업무로 판단한 이유"
    }
  ],
  "otherTasksList": [
    {
      "task": "한줄 업무 요약 (목적+행동, 20자 이내)",
      "oneLiner": "보고서용 초간단 한줄 설명",
      "purpose": "업무 목적",
      "department": "담당 부서 추정",
      "details": "내용 요약"
    }
  ],
  "summary": {
    "totalMessages": ${messages.length},
    "cameraTasksCount": 0,
    "otherTasksCount": 0,
    "activeUsers": [],
    "mainTopics": [],
    "urgentItems": []
  }
}

카메라 파트 업무 판별 기준:
1. 영상/사진 촬영 (드론, 카메라, 스튜디오)
2. 영상 편집 및 후반작업 (편집, 색보정, 자막, 렌더링)
3. 라이브 스트리밍 및 중계
4. 촬영 장비 관리 (구매, 대여, 수리, 점검)
5. 미디어 자산 관리 (MAM, 아카이빙)
6. 콘텐츠 제작 중 촬영이 필요한 부분

중요 - 업무명 작성 원칙: 

1. **극도로 간결한 한줄 표현 (최우선)**
   - task: 20자 이내로 목적+행동 압축
   - oneLiner: 15자 이내로 핵심만 표현
   
   예시:
   나쁜 예: "NSUS GFX 개발팀의 포커 프로덕션 시연 테스트를 위한 카메라 시스템 설치"
   좋은 예: 
   - task: "포커 시연용 카메라 6대 설치"
   - oneLiner: "시연 카메라 세팅"

2. **목적은 간단명료하게**
   나쁜 예: "카메라 설치" → 왜?
   좋은 예: "포커 중계용 카메라 설치" → 목적 명확
   
3. **불필요한 수식어 제거**
   나쁜 예: "중요한 대규모 프로젝트를 위한 특별한 카메라 시스템 구축"
   좋은 예: "프로젝트 촬영 시스템 구축"

4. **보고서 가독성 최우선**
   - 한눈에 파악 가능한 업무명
   - 스크롤 없이 읽을 수 있는 길이
   - 핵심 키워드만 포함

5. **상세 정보는 별도 필드에**
   - task/oneLiner: 초간단 요약
   - purpose: 왜 하는지
   - details: 구체적 내용
   - context: 배경 설명

대화에서 핵심만 추출하여 가장 짧고 명확하게 표현하세요.
길게 설명하지 말고 핵심 단어만으로 업무를 정의하세요.
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log(`${colors.green}   ✅ 분석 완료${colors.reset}`);
            console.log(`   - 카메라 파트 업무: ${analysis.cameraTasksList?.length || 0}개`);
            console.log(`   - 기타 부서 업무: ${analysis.otherTasksList?.length || 0}개`);
            return analysis;
        }
    } catch (error) {
        console.error(`${colors.red}   ❌ AI 분석 실패:${colors.reset}`, error.message);
    }
    
    return null;
}

/**
 * 분석 결과 출력
 */
function displayResults(analysis) {
    if (!analysis) {
        console.log(`\n${colors.yellow}📊 분석 결과가 없습니다${colors.reset}`);
        return;
    }
    
    console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}📊 Slack 채널 업무 분석 결과${colors.reset}`);
    console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
    
    // 요약 정보
    if (analysis.summary) {
        console.log(`\n${colors.cyan}📈 요약${colors.reset}`);
        console.log(`   총 메시지: ${analysis.summary.totalMessages}개`);
        console.log(`   활성 사용자: ${analysis.summary.activeUsers?.join(', ') || '없음'}`);
        console.log(`   주요 주제: ${analysis.summary.mainTopics?.join(', ') || '없음'}`);
        if (analysis.summary.urgentItems?.length > 0) {
            console.log(`   ${colors.red}🚨 긴급 사항: ${analysis.summary.urgentItems.join(', ')}${colors.reset}`);
        }
    }
    
    // 카메라 파트 업무
    console.log(`\n${colors.green}📸 카메라 파트 업무 (${analysis.cameraTasksList?.length || 0}개)${colors.reset}`);
    console.log('-'.repeat(60));
    
    if (analysis.cameraTasksList && analysis.cameraTasksList.length > 0) {
        analysis.cameraTasksList.forEach((task, idx) => {
            const priorityStars = '⭐'.repeat(Math.max(1, 6 - task.priority));
            console.log(`\n${colors.bright}${idx + 1}. ${task.task}${colors.reset} ${priorityStars}`);
            if (task.oneLiner) console.log(`   ${colors.magenta}[${task.oneLiner}]${colors.reset}`);
            console.log(`   ${colors.cyan}목적: ${task.purpose}${colors.reset}`);
            console.log(`   ${colors.dim}배경: ${task.context}${colors.reset}`);
            console.log(`   ${colors.dim}카테고리: ${task.category}${colors.reset}`);
            console.log(`   담당자: ${task.assignee || '미정'}`);
            console.log(`   실행 내용: ${task.details}`);
            if (task.expectedResult) console.log(`   기대 결과: ${colors.green}${task.expectedResult}${colors.reset}`);
            if (task.deadline) console.log(`   마감: ${colors.yellow}${task.deadline}${colors.reset}`);
            if (task.progress) console.log(`   진행률: ${task.progress}`);
            console.log(`   ${colors.dim}판단 근거: ${task.reasoning}${colors.reset}`);
        });
    } else {
        console.log('   카메라 파트 관련 업무가 없습니다.');
    }
    
    // 기타 부서 업무
    console.log(`\n${colors.blue}📋 기타 부서 업무 (${analysis.otherTasksList?.length || 0}개)${colors.reset}`);
    console.log('-'.repeat(60));
    
    if (analysis.otherTasksList && analysis.otherTasksList.length > 0) {
        analysis.otherTasksList.forEach((task, idx) => {
            console.log(`\n${idx + 1}. ${task.task}`);
            console.log(`   ${colors.cyan}목적: ${task.purpose}${colors.reset}`);
            console.log(`   담당 부서: ${task.department || '미분류'}`);
            console.log(`   내용: ${task.details}`);
        });
    } else {
        console.log('   기타 부서 업무가 없습니다.');
    }
    
    // 우선순위 TOP 3
    if (analysis.cameraTasksList && analysis.cameraTasksList.length > 0) {
        const top3 = analysis.cameraTasksList
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 3);
        
        console.log(`\n${colors.bright}${colors.magenta}🏆 카메라 파트 우선순위 TOP 3 (한줄 요약)${colors.reset}`);
        console.log('='.repeat(60));
        top3.forEach((task, idx) => {
            const oneLiner = task.oneLiner || task.task;
            console.log(`${idx + 1}. ${colors.bright}${oneLiner}${colors.reset} - ${task.assignee || '미정'} (${task.deadline || '미정'})`);
        });
        
        console.log(`\n${colors.dim}상세 내용:${colors.reset}`);
        top3.forEach((task, idx) => {
            console.log(`${idx + 1}. ${task.task}`);
            console.log(`   └─ ${task.details}`);
        });
    }
    
    console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * 메인 실행 함수
 */
async function main() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          Slack 채널 AI 업무 분석 시스템 v1.0            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    
    const channelId = process.env.SLACK_CHANNEL_ID;
    
    if (!channelId || channelId === 'C-your-channel-id') {
        console.error(`${colors.red}❌ 오류: SLACK_CHANNEL_ID가 설정되지 않았습니다${colors.reset}`);
        process.exit(1);
    }
    
    // 메시지 수집 (최근 24시간)
    const messages = await fetchChannelMessages(channelId, 24);
    
    if (messages.length === 0) {
        console.log(`${colors.yellow}분석할 메시지가 없습니다${colors.reset}`);
        process.exit(0);
    }
    
    // AI 분석
    const analysis = await analyzeWithAI(messages);
    
    // 결과 출력
    displayResults(analysis);
    
    // 파일로 저장
    if (analysis) {
        const filename = `analysis-${new Date().toISOString().slice(0, 10)}.json`;
        require('fs').writeFileSync(filename, JSON.stringify(analysis, null, 2));
        console.log(`${colors.green}💾 분석 결과가 ${filename}에 저장되었습니다${colors.reset}`);
    }
}

// 실행
main().catch(error => {
    console.error(`${colors.red}💥 치명적 오류:${colors.reset}`, error);
    process.exit(1);
});