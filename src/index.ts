import dotenv from 'dotenv';
import { Scheduler } from './services/scheduler';
import { ReportGenerator } from './services/reportGenerator';

dotenv.config();

async function main() {
  console.log('Camera Work Auto Report System Starting...');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--run-once')) {
    console.log('Running report generation once...');
    const generator = new ReportGenerator();
    const success = await generator.generateReport();
    process.exit(success ? 0 : 1);
  } else {
    const scheduler = new Scheduler();
    scheduler.start();
    
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      scheduler.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\nShutting down...');
      scheduler.stop();
      process.exit(0);
    });
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});