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
      
      // 전체 메시지 중 카메라 관련 메시지 수 확인
      const cameraMessages = messages.filter(msg => {
        const text = msg.text.toLowerCase();
        return text.includes('촬영') || text.includes('카메라') || 
               text.includes('드론') || text.includes('영상') || 
               text.includes('편집') || text.includes('렌즈') || 
               text.includes('장비');
      });
      console.log(`\n- 카메라 관련 메시지 수: ${cameraMessages.length}개 / 전체 ${messages.length}개`);
      
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
        console.log('  3. 메시지 형식이 업무로 분류되지 않음');
      }
      
      // 카메라 관련 키워드 확인
      console.log('\n8. 카메라 관련 키워드 검색:');
      const cameraKeywords = ['촬영', '카메라', '드론', '영상', '편집', '렌즈', '장비'];
      const foundKeywords = new Set<string>();
      const keywordCount: Record<string, number> = {};
      
      messages.forEach(msg => {
        cameraKeywords.forEach(keyword => {
          if (msg.text.includes(keyword)) {
            foundKeywords.add(keyword);
            keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
          }
        });
      });
      
      console.log('- 발견된 키워드:', Array.from(foundKeywords).join(', ') || '없음');
      console.log('- 키워드별 빈도:');
      Object.entries(keywordCount).forEach(([keyword, count]) => {
        console.log(`    ${keyword}: ${count}회`);
      });
      
      // 카메라 관련 메시지 샘플 출력
      if (cameraMessages.length > 0) {
        console.log('\n9. 카메라 관련 메시지 샘플 (최대 3개):');
        cameraMessages.slice(0, 3).forEach((msg, i) => {
          const text = msg.text.substring(0, 150).replace(/\n/g, ' ');
          console.log(`  ${i + 1}. ${msg.user}: ${text}`);
        });
      }
      
      // JSON 파싱 테스트
      console.log('\n10. AI 응답 원본 확인:');
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