// 날짜 계산 로직 테스트

function testWeeklyDateCalculation() {
  console.log('=== Weekly Report Date Calculation Test ===\n');
  
  const now = new Date();
  console.log('Current date:', now.toISOString());
  console.log('Current date (local):', now.toString());
  console.log('Day of week (0=Sun, 6=Sat):', now.getDay());
  
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  console.log('\nCalculation:');
  console.log('- Current date:', now.getDate());
  console.log('- Day of week:', dayOfWeek);
  console.log('- Diff:', diff);
  
  // 지난 주 월요일 00:00
  const since = new Date(now.getFullYear(), now.getMonth(), diff - 7);
  since.setHours(0, 0, 0, 0);
  
  // 지난 주 일요일 23:59
  const until = new Date(since);
  until.setDate(until.getDate() + 6);
  until.setHours(23, 59, 59, 999);
  
  console.log('\nWeekly report period:');
  console.log('From:', since.toISOString(), '(' + since.toString() + ')');
  console.log('To:', until.toISOString(), '(' + until.toString() + ')');
  
  // 메시지가 있어야 할 날짜 범위 확인
  const testDate = new Date('2025-07-28');  // 지난 월요일
  console.log('\nTest: Is 2025-07-28 in range?', testDate >= since && testDate <= until);
}

function testMonthlyDateCalculation() {
  console.log('\n\n=== Monthly Report Date Calculation Test ===\n');
  
  const now = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  since.setHours(0, 0, 0, 0);
  
  const until = new Date(now.getFullYear(), now.getMonth(), 0);
  until.setHours(23, 59, 59, 999);
  
  console.log('Monthly report period:');
  console.log('From:', since.toISOString(), '(' + since.toString() + ')');
  console.log('To:', until.toISOString(), '(' + until.toString() + ')');
}

testWeeklyDateCalculation();
testMonthlyDateCalculation();