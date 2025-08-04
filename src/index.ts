import dotenv from 'dotenv';

// Slack 리포트 시스템 서비스
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { ReportService } from './services/report.service';
import { Scheduler as SlackScheduler } from './utils/scheduler';

// 카메라 리포트 시스템 서비스
// 참고: 이름 충돌을 피하기 위해 파일명을 변경하거나 폴더 구조를 분리하는 것을 권장합니다.
// 예: src/camera/scheduler.ts, src/slack/scheduler.ts
import { Scheduler as CameraScheduler } from './services/scheduler';
import { ReportGenerator as CameraReportGenerator } from './services/reportGenerator';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);

  // '--camera-report' 인자가 있으면 카메라 리포트 시스템을 실행합니다.
  if (args.includes('--camera-report')) {
    console.log('Camera Work Auto Report System Starting...');
    
    if (args.includes('--run-once')) {
      console.log('Running camera report generation once...');
      const generator = new CameraReportGenerator();
      const success = await generator.generateReport();
      process.exit(success ? 0 : 1);
    } else {
      const scheduler = new CameraScheduler();
      scheduler.start();
      setupShutdownHandlers(scheduler);
    }
    return;
  }

  // 기본적으로 Slack 리포트 자동화 시스템을 실행합니다.
  console.log('Slack Report Automation Starting...');

  // 환경 변수 검증
  const requiredEnvVars = [
    'SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID', 'SLACK_DM_USER_IDS',
    'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // 서비스 초기화
  const slackService = new SlackService(process.env.SLACK_BOT_TOKEN!);
  const supabaseService = new SupabaseService(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  const { GeminiService } = await import('./services/gemini.service');
  const geminiService = new GeminiService(process.env.GEMINI_API_KEY!);
  const reportService = new ReportService(slackService, supabaseService, geminiService);
  const dmUserIds = process.env.SLACK_DM_USER_IDS!.split(',').map(id => id.trim());
  const scheduler = new SlackScheduler(
    reportService,
    process.env.SLACK_CHANNEL_ID!,
    dmUserIds
  );

  // 스케줄 설정
  const dailyTime = process.env.DAILY_REPORT_TIME || '09:00';
  const [hour, minute] = dailyTime.split(':');
  const dailyCron = `${minute} ${hour} * * *`;
  const weeklyDay = parseInt(process.env.WEEKLY_REPORT_DAY || '1');
  const monthlyDay = parseInt(process.env.MONTHLY_REPORT_DAY || '1');

  // 스케줄러 시작
  scheduler.startScheduler(dailyCron, weeklyDay, monthlyDay);
  console.log('Slack Report Automation started successfully!');
  setupShutdownHandlers(scheduler);
}

// 정상 종료를 위한 핸들러
function setupShutdownHandlers(scheduler: { stop: () => void } | { stopScheduler: () => void }) {
  const shutdown = () => {
    console.log('\nShutting down...');
    if ('stop' in scheduler) {
      scheduler.stop();
    } else if ('stopScheduler' in scheduler) {
      scheduler.stopScheduler();
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
