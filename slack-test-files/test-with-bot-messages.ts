import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';
import { ChannelMessage } from './src/types';

dotenv.config();

async function testWithBotMessages() {
  console.log('봇이 보낼 테스트 메시지로 보고서 생성...\n');
  
  const requiredVars = ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID', 'SLACK_DM_USER_ID', 'GEMINI_API_KEY'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    return;
  }

  try {
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    const channelId = process.env.SLACK_CHANNEL_ID!;
    
    // Step 1: Send test messages to channel
    console.log('채널에 테스트 메시지 전송 중...');
    const testMessages = [
      '신규 고객 대응 시스템 개발 완료. 배포 준비중입니다.',
      '마케팅 캠페인 ROI 분석 보고서 작성 완료했습니다.',
      'API 서버 성능 최적화 작업 진행중. 응답속도 40% 개선 목표.',
      '보안 패치 긴급 적용 필요. 내일 오전 점검 예정입니다.',
      '3분기 매출 목표 초과 달성. 상세 분석 자료 준비중.',
      '신입 개발자 온보딩 프로그램 개선안 작성 완료.',
      '클라우드 인프라 비용 20% 절감 방안 검토중입니다.',
      '고객 피드백 기반 UI/UX 개선 사항 정리 완료.'
    ];

    for (const msg of testMessages) {
      await slackService.sendDirectMessage(channelId, msg);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    console.log(`${testMessages.length}개의 테스트 메시지 전송 완료\n`);
    
    // Step 2: Create dummy message objects for analysis
    const now = Date.now() / 1000;
    const dummyMessages: ChannelMessage[] = testMessages.map((text, index) => ({
      user: process.env.SLACK_BOT_TOKEN!.split('-')[1], // Bot user ID
      text: text,
      timestamp: (now - (testMessages.length - index) * 60).toString()
    }));
    
    // Step 3: Analyze with Gemini
    console.log('Gemini AI로 메시지 분석 중...');
    const analysis = await geminiService.analyzeMessages(dummyMessages, 'daily');
    
    // Step 4: Format and send report
    let report = `📊 *일일 업무 보고 (테스트)*\n\n`;
    
    if (analysis.insights?.actionItems && analysis.insights.actionItems.length > 0) {
      report += `*오늘의 주요 업무:*\n`;
      report += analysis.insights.actionItems.map(a => `• ${a}`).join('\n');
      report += '\n\n';
    }
    
    report += `*활동 요약:* ${analysis.totalMessages}개 업무, ${analysis.activeUsers.length}명 참여\n`;
    report += '\n_참고: 이 보고서는 방금 전송한 테스트 메시지를 기반으로 생성되었습니다._';
    
    console.log('\nDM으로 보고서 전송 중...');
    await slackService.sendDirectMessage(process.env.SLACK_DM_USER_ID!, report);
    
    console.log('✅ 테스트 보고서가 성공적으로 전송되었습니다!');
    console.log('\n📌 실제 채널 메시지를 분석하려면 SLACK_PERMISSIONS_GUIDE.md를 참고하여 권한을 추가하세요.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWithBotMessages();