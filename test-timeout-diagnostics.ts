import 'dotenv/config';
import { SlackService } from './src/services/slack.service';
import { GeminiService } from './src/services/gemini.service';
import { SupabaseService } from './src/services/supabase.service';
import { DiagnosticReportService } from './src/services/diagnostic-report.service';

async function runDiagnostics() {
  console.log('🔍 Running Timeout Diagnostics Test...\n');

  // 환경 변수 검증
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN',
    'SLACK_CHANNEL_ID',
    'SLACK_DM_USER_IDS',
    'GEMINI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    process.exit(1);
  }

  try {
    // 서비스 초기화
    const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
    const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
    const supabaseService = new SupabaseService(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const diagnosticService = new DiagnosticReportService(
      slackService,
      geminiService,
      supabaseService
    );

    // 실행 옵션
    const channelId = process.env.SLACK_CHANNEL_ID!;
    const dmUserIds = process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim());
    const reportType = (process.argv[2] as 'daily' | 'weekly' | 'monthly') || 'daily';

    console.log('📋 Configuration:');
    console.log(`- Channel ID: ${channelId}`);
    console.log(`- DM Users: ${dmUserIds.length} users`);
    console.log(`- Report Type: ${reportType}`);
    console.log(`- Start Time: ${new Date().toISOString()}`);
    console.log('\n========================================\n');

    // 진단 모드로 실행
    await diagnosticService.generateReportWithDiagnostics(
      channelId,
      dmUserIds,
      reportType
    );

    console.log('\n✅ Diagnostic test completed successfully!');

  } catch (error) {
    console.error('\n❌ Diagnostic test failed:', error);
    
    // 에러 타입 분석
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('\n🕒 TIMEOUT ERROR DETECTED');
        console.error('This indicates the operation took too long to complete.');
      } else if (error.message.includes('not_in_channel')) {
        console.error('\n🚫 CHANNEL ACCESS ERROR');
        console.error('The bot needs to be invited to the channel first.');
      } else if (error.message.includes('invalid_auth')) {
        console.error('\n🔐 AUTHENTICATION ERROR');
        console.error('Please check your Slack bot token.');
      }
    }

    process.exit(1);
  }
}

// 추가 진단 명령어
if (process.argv[2] === '--quick-test') {
  // 빠른 연결 테스트
  quickConnectionTest();
} else if (process.argv[2] === '--benchmark') {
  // 성능 벤치마크
  runBenchmark();
} else {
  // 전체 진단 실행
  runDiagnostics();
}

async function quickConnectionTest() {
  console.log('🔌 Running quick connection test...\n');

  const tests = [
    {
      name: 'Slack API',
      test: async () => {
        const slack = new SlackService(process.env.SLACK_BOT_TOKEN!);
        const start = Date.now();
        await slack.getChannelInfo(process.env.SLACK_CHANNEL_ID!);
        return Date.now() - start;
      }
    },
    {
      name: 'Gemini AI',
      test: async () => {
        const gemini = new GeminiService(process.env.GEMINI_API_KEY!);
        const start = Date.now();
        await gemini.analyzeMessages([{ user: 'test', text: 'Hello' }], 'daily');
        return Date.now() - start;
      }
    },
    {
      name: 'Supabase',
      test: async () => {
        const supabase = new SupabaseService(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_ANON_KEY!
        );
        const start = Date.now();
        await supabase.getRecentReports('daily', 1);
        return Date.now() - start;
      }
    }
  ];

  for (const { name, test } of tests) {
    try {
      const duration = await test();
      console.log(`✅ ${name}: ${duration}ms`);
    } catch (error) {
      console.log(`❌ ${name}: Failed - ${(error as Error).message}`);
    }
  }
}

async function runBenchmark() {
  console.log('📊 Running performance benchmark...\n');

  const messagesCounts = [10, 50, 100, 500, 1000];
  const results: any[] = [];

  for (const count of messagesCounts) {
    console.log(`\nTesting with ${count} messages...`);
    
    // 더미 메시지 생성
    const messages = Array.from({ length: count }, (_, i) => ({
      user: `U${i}`,
      text: `Test message ${i} with some content about work and tasks`,
      timestamp: new Date().toISOString(),
      thread_ts: i % 10 === 0 ? `thread_${i}` : undefined,
      reply_count: i % 10 === 0 ? 5 : 0
    }));

    try {
      const gemini = new GeminiService(process.env.GEMINI_API_KEY!);
      const start = Date.now();
      await gemini.analyzeMessages(messages, 'daily');
      const duration = Date.now() - start;
      
      results.push({ count, duration, status: 'success' });
      console.log(`✅ Completed in ${duration}ms`);
    } catch (error) {
      results.push({ count, duration: null, status: 'failed', error: (error as Error).message });
      console.log(`❌ Failed: ${(error as Error).message}`);
    }
  }

  console.log('\n📊 Benchmark Results:');
  console.table(results);
}