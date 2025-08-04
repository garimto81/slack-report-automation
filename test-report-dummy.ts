import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';
import { ChannelMessage } from './src/types';

dotenv.config();

async function testReportWithDummyData() {
  console.log('Starting test with dummy data...\n');
  
  // Validate required environment variables
  const requiredVars = ['SLACK_BOT_TOKEN', 'SLACK_DM_USER_ID', 'GEMINI_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    return;
  }

  try {
    // Initialize services
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    
    // Create dummy messages with more work-focused content
    const dummyMessages: ChannelMessage[] = [
      {
        user: 'U123456',
        text: '신규 프로젝트 기획서 초안 작성 완료했습니다. 검토 부탁드립니다.',
        timestamp: '1234567890.123456'
      },
      {
        user: 'U234567',
        text: '프로젝트 예산안 재무팀에 제출했습니다. 승인 대기중입니다.',
        timestamp: '1234567891.123456'
      },
      {
        user: 'U345678',
        text: 'API 설계 문서 작성 중입니다. 내일까지 완료 예정입니다.',
        timestamp: '1234567892.123456'
      },
      {
        user: 'U123456',
        text: '고객 인터뷰 3건 완료. 피드백 정리해서 공유하겠습니다.',
        timestamp: '1234567893.123456'
      },
      {
        user: 'U234567',
        text: '마케팅 캠페인 A/B 테스트 시작했습니다. 일주일 후 결과 공유 예정.',
        timestamp: '1234567894.123456'
      },
      {
        user: 'U456789',
        text: '서버 인프라 증설 완료. 성능 30% 개선 확인했습니다.',
        timestamp: '1234567895.123456'
      },
      {
        user: 'U345678',
        text: '보안 취약점 스캔 완료. 중요도 높음 2건 발견, 패치 진행중.',
        timestamp: '1234567896.123456'
      },
      {
        user: 'U567890',
        text: '신규 기능 개발 완료. QA 팀에 테스트 요청했습니다.',
        timestamp: '1234567897.123456'
      },
      {
        user: 'U123456',
        text: '다음 분기 로드맵 초안 작성 완료. 리뷰 미팅 일정 조율하겠습니다.',
        timestamp: '1234567898.123456'
      },
      {
        user: 'U234567',
        text: '파트너사 계약서 법무팀 검토 완료. 최종 서명만 남았습니다.',
        timestamp: '1234567899.123456'
      }
    ];
    
    console.log(`Using ${dummyMessages.length} dummy messages for analysis...\n`);
    
    // Analyze messages with Gemini
    console.log('Analyzing messages with Gemini AI...');
    const analysis = await geminiService.analyzeMessages(dummyMessages, 'daily');
    
    // Format report (using the same format as daily report)
    let report = `🧪 *테스트 일일 업무 보고*\n\n`;
    
    // 주요 업무 사항 (1줄씩)
    if (analysis.insights?.actionItems && analysis.insights.actionItems.length > 0) {
      report += `*오늘의 주요 업무:*\n`;
      report += analysis.insights.actionItems.map(a => `• ${a}`).join('\n');
      report += '\n\n';
    }

    // 통계 요약 (간단히)
    report += `*활동 요약:* ${analysis.totalMessages}개 메시지, ${analysis.activeUsers.length}명 참여\n`;
    
    // 상위 기여자 (간단히)
    if (analysis.topContributors.length > 0) {
      const topUser = analysis.topContributors[0];
      report += `*최다 참여:* User ${topUser.user} (${topUser.messageCount}개)\n`;
    }
    
    // Send test report
    console.log('\nSending test report to user...');
    await slackService.sendDirectMessage(process.env.SLACK_DM_USER_ID!, report);
    
    console.log('✅ Test report sent successfully!');
    console.log('\n📌 Note: This test used dummy data. To use real channel data, please add the following permissions to your Slack app:');
    console.log('   - channels:history');
    console.log('   - groups:history');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testReportWithDummyData();