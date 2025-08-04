import { ReportGenerator } from '../dist/services/reportGenerator.js';

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  
  // 인증 확인 (cron-job.org 등에서 호출 시)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or missing authorization' 
    });
  }
  
  // GET 요청 처리 (상태 확인)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      message: 'Camera report API is running',
      nextRun: getNextRunTime()
    });
  }
  
  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Use POST to generate report' 
    });
  }
  
  try {
    console.log('Starting report generation via API...');
    
    const generator = new ReportGenerator();
    const success = await generator.generateReport();
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in report API:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getNextRunTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0); // 다음날 오전 10시
  
  // 만약 오늘 10시 전이면 오늘 10시
  const today10am = new Date(now);
  today10am.setHours(10, 0, 0, 0);
  
  if (now < today10am) {
    return today10am.toISOString();
  }
  
  return tomorrow.toISOString();
}