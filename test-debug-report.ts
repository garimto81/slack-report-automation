import * as dotenv from 'dotenv';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';

dotenv.config();

async function debugReport() {
  console.log('\n=== 디버깅 시작 ===\n');
  
  // 환경변수 확인
  console.log('1. 환경변수 확인:');
  console.log('- SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? '설정됨' : '미설정');
  console.log('- SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID || '미설정');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '설정됨' : '미설정');
  
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_CHANNEL_ID || !process.env.GEMINI_API_KEY) {
    console.log('\n❌ 필수 환경변수가 설정되지 않았습니다.');
    return;
  }

  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN);
  const geminiService = new GeminiService(process.env.GEMINI_API_KEY);
  
  // 시간 범위 확인
  console.log('\n2. 시간 범위 확인:');
  const now = new Date();
  const dailySince = new Date();
  dailySince.setDate(dailySince.getDate() - 1);
  const weeklySince = new Date();
  weeklySince.setDate(weeklySince.getDate() - 7);
  
  console.log('- 현재 시간:', now.toLocaleString('ko-KR'));
  console.log('- 일일 보고서 시작:', dailySince.toLocaleString('ko-KR'));
  console.log('- 주간 보고서 시작:', weeklySince.toLocaleString('ko-KR'));
  
  // 메시지 수집
  console.log('\n3. 메시지 수집 중...');
  try {
    const messages = await slackService.getChannelMessages(
      process.env.SLACK_CHANNEL_ID,
      weeklySince
    );
    
    console.log(`- 수집된 메시지 수: ${messages.length}개`);
    
    if (messages.length > 0) {
      console.log('\n4. 최근 5개 메시지 샘플:');
      messages.slice(0, 5).forEach((msg, i) => {
        const text = msg.text.substring(0, 100).replace(/\n/g, ' ');
        const threadInfo = msg.reply_count ? ` [답글 ${msg.reply_count}개]` : '';
        console.log(`  ${i + 1}. ${msg.user}: ${text}...${threadInfo}`);
      });
      
      console.log(`\n- 전체 메시지 수: ${messages.length}개`);
      console.log('- 참고: AI가 전체 문맥을 분석하여 카메라 파트 업무 추론');
      
      // AI 분석
      console.log('\n5. Gemini AI 분석 중...');
      const analysis = await geminiService.analyzeMessages(messages, 'daily');
      
      console.log('\n6. 분석 결과:');
      console.log('- 전체 메시지 수:', analysis.totalMessages);
      console.log('- 활성 사용자 수:', analysis.activeUsers?.length || 0);
      
      if (analysis.insights?.actionItems) {
        console.log('- 추출된 업무 수:', analysis.insights.actionItems.length);
        console.log('\n7. 추출된 업무 목록:');
        analysis.insights.actionItems.forEach((item: any, i: number) => {
          if (typeof item === 'string') {
            console.log(`  ${i + 1}. ${item}`);
          } else {
            console.log(`  ${i + 1}. [우선순위 ${item.priority}] ${item.summary || item.task}`);
          }
        });
      } else {
        console.log('- 추출된 업무: 없음');
        console.log('\n❓ 가능한 원인:');
        console.log('  1. 카메라 파트 관련 메시지가 없음');
        console.log('  2. AI가 카메라 업무로 인식하지 못함');
        console.log('  3. 메시지가 일상 대화로 분류됨');
        console.log('  4. AI 프롬프트가 너무 엄격함');
      }
      
      // AI 추론 능력 설명
      console.log('\n8. AI 분석 방식:');
      console.log('- 단순 키워드 매칭이 아닌 문맥 기반 추론');
      console.log('- 전체 대화 흐름과 맥락을 이해');
      console.log('- 카메라 파트 업무 여부를 AI가 판단');
      console.log('\n예시:');
      console.log('- "내일 회의" → 카메라 업무 아님');
      console.log('- "내일 팍스타워 4K 준비" → 카메라 업무로 추론 가능');
      
      // JSON 파싱 테스트
      console.log('\n9. AI 응답 원본 확인:');
      try {
        const testAnalysis = await geminiService.analyzeMessages(messages.slice(0, 10), 'daily');
        console.log('- AI 응답 타입:', typeof testAnalysis);
        console.log('- insights 존재:', !!testAnalysis.insights);
        console.log('- actionItems 존재:', !!testAnalysis.insights?.actionItems);
        if (testAnalysis.insights?.actionItems) {
          console.log('- actionItems 길이:', testAnalysis.insights.actionItems.length);
          console.log('- 첫 번째 actionItem:', JSON.stringify(testAnalysis.insights.actionItems[0], null, 2));
        }
      } catch (err) {
        console.log('- AI 분석 중 오류:', err);
      }
      
    } else {
      console.log('\n❌ 수집된 메시지가 없습니다.');
      console.log('가능한 원인:');
      console.log('- 잘못된 채널 ID');
      console.log('- 봇이 채널에 추가되지 않음');
      console.log('- 해당 기간에 메시지가 없음');
    }
    
  } catch (error: any) {
    console.log('\n❌ 오류 발생:', error.message);
    if (error.data?.error === 'invalid_auth') {
      console.log('-> Slack 토큰이 유효하지 않습니다.');
    } else if (error.data?.error === 'channel_not_found') {
      console.log('-> 채널을 찾을 수 없습니다. 채널 ID를 확인하세요.');
    } else if (error.data?.error === 'not_in_channel') {
      console.log('-> 봇이 채널에 추가되지 않았습니다.');
    }
  }
  
  console.log('\n=== 디버깅 완료 ===\n');
}

debugReport().catch(console.error);