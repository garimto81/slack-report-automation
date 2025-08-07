/**
 * Slack DM 전송 테스트 스크립트
 * 사용법: node test-slack-dm.js
 */

require('dotenv').config();

// 사용자 정보
const users = [
    { id: 'U05MYPN16Q3', name: 'Kai.Kim', role: '팀장/관리자' },
    { id: 'U040EUZ6JRY', name: 'Aiden.Kim', role: '개발자/엔지니어' },
    { id: 'U080BA70DC4', name: 'Hazel.Kim', role: '프로젝트 매니저' },
    { id: 'U05QNJWPFBJ', name: 'Trey.Song', role: '카메라 파트' },
    { id: 'U040HCT21CL', name: 'Matthew.Kim', role: '경영진/리더' }
];

// Slack Web API 클라이언트 초기화
const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// 테스트 메시지 포맷
function createTestMessage(user) {
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    
    return {
        text: `📊 테스트 보고서 - ${user.name}`,
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🔔 Slack DM 테스트"
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `안녕하세요 *${user.name}*님!\n역할: *${user.role}*`
                }
            },
            {
                type: "divider"
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*📸 카메라 파트 업무 현황 (테스트)*"
                }
            },
            {
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: "*1. AI 자막 자동화*\n진행률: 80%"
                    },
                    {
                        type: "mrkdwn",
                        text: "*2. 드론 촬영 준비*\n진행률: 60%"
                    },
                    {
                        type: "mrkdwn",
                        text: "*3. 유튜브 썸네일 제작*\n진행률: 40%"
                    }
                ]
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `🕐 전송 시간: ${now} (KST)`
                    }
                ]
            }
        ]
    };
}

// DM 전송 함수
async function sendTestDM(user) {
    try {
        console.log(`\n📤 ${user.name}(${user.id})님께 DM 전송 중...`);
        
        // DM 채널 열기
        const dmChannel = await slack.conversations.open({
            users: user.id
        });
        
        if (!dmChannel.ok) {
            throw new Error('DM 채널을 열 수 없습니다');
        }
        
        // 메시지 전송
        const message = createTestMessage(user);
        const result = await slack.chat.postMessage({
            channel: dmChannel.channel.id,
            ...message
        });
        
        if (result.ok) {
            console.log(`✅ ${user.name}님께 성공적으로 전송됨!`);
            return true;
        } else {
            throw new Error('메시지 전송 실패');
        }
        
    } catch (error) {
        console.error(`❌ ${user.name}님 전송 실패:`, error.message);
        return false;
    }
}

// 메인 실행 함수
async function main() {
    console.log('========================================');
    console.log('      Slack DM 전송 테스트 시작');
    console.log('========================================');
    
    // Bot Token 확인
    if (!process.env.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN === 'xoxb-your-slack-bot-token') {
        console.error('\n❌ 오류: SLACK_BOT_TOKEN이 설정되지 않았습니다.');
        console.log('📝 .env 파일에 실제 Slack Bot Token을 설정해주세요.');
        process.exit(1);
    }
    
    console.log('\n📋 전송 대상 사용자 목록:');
    users.forEach(user => {
        console.log(`   - ${user.name} (${user.role}): ${user.id}`);
    });
    
    // 각 사용자에게 순차적으로 전송
    const results = [];
    for (const user of users) {
        const success = await sendTestDM(user);
        results.push({ user: user.name, success });
        
        // API 제한 방지를 위한 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 결과 요약
    console.log('\n========================================');
    console.log('            테스트 결과 요약');
    console.log('========================================');
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 성공: ${successCount}명`);
    console.log(`❌ 실패: ${failCount}명`);
    
    results.forEach(r => {
        console.log(`   ${r.success ? '✅' : '❌'} ${r.user}`);
    });
    
    console.log('\n💡 팁:');
    console.log('1. 실패한 경우 Bot Token과 권한을 확인하세요.');
    console.log('2. Bot은 다음 권한이 필요합니다:');
    console.log('   - channels:history');
    console.log('   - channels:read');
    console.log('   - chat:write');
    console.log('   - im:write');
    console.log('   - users:read');
    console.log('3. 사용자가 Bot과 DM을 차단하지 않았는지 확인하세요.');
}

// 실행
main().catch(error => {
    console.error('\n💥 치명적 오류:', error);
    process.exit(1);
});