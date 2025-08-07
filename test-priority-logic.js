/**
 * 우선순위 로직 테스트 스크립트
 * 다양한 날짜에 대해 어떤 보고서가 생성되는지 검증
 */

function determineReportType(date) {
    const dayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const dayOfMonth = date.getDate();
    
    // 주말 체크 (토요일=6, 일요일=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'SKIP (주말)';
    }
    
    // 우선순위: 월간 > 주간 > 일간
    if (dayOfMonth === 1) {
        return '월간';
    } else if (dayOfWeek === 1) {
        return '주간';
    } else {
        return '일간';
    }
}

function getDayName(dayOfWeek) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayOfWeek];
}

function testYear2025() {
    console.log('📊 2025년 보고서 생성 시뮬레이션');
    console.log('═'.repeat(60));
    
    const testCases = [
        // 2025년 주요 날짜들
        { date: new Date(2025, 0, 1), desc: '1월 1일 (신정)' },
        { date: new Date(2025, 0, 6), desc: '1월 6일' },
        { date: new Date(2025, 1, 1), desc: '2월 1일' },
        { date: new Date(2025, 1, 3), desc: '2월 3일' },
        { date: new Date(2025, 2, 1), desc: '3월 1일' },
        { date: new Date(2025, 2, 3), desc: '3월 3일' },
        { date: new Date(2025, 3, 1), desc: '4월 1일' },
        { date: new Date(2025, 3, 7), desc: '4월 7일' },
        { date: new Date(2025, 4, 1), desc: '5월 1일' },
        { date: new Date(2025, 5, 1), desc: '6월 1일' },
        { date: new Date(2025, 5, 2), desc: '6월 2일' },
        { date: new Date(2025, 6, 1), desc: '7월 1일' },
        { date: new Date(2025, 7, 1), desc: '8월 1일' },
        { date: new Date(2025, 8, 1), desc: '9월 1일 ⭐' },
        { date: new Date(2025, 9, 1), desc: '10월 1일' },
        { date: new Date(2025, 10, 1), desc: '11월 1일' },
        { date: new Date(2025, 10, 3), desc: '11월 3일' },
        { date: new Date(2025, 11, 1), desc: '12월 1일' },
    ];
    
    console.log('\n날짜\t\t요일\t보고서 타입\t설명');
    console.log('─'.repeat(60));
    
    testCases.forEach(testCase => {
        const { date, desc } = testCase;
        const dayName = getDayName(date.getDay());
        const reportType = determineReportType(date);
        const highlight = reportType === '월간' && date.getDay() === 1 ? ' ← 월간 우선!' : '';
        
        console.log(`${desc}\t${dayName}요일\t${reportType}\t${highlight}`);
    });
}

function testSpecialCases() {
    console.log('\n\n🎯 특수 케이스 테스트');
    console.log('═'.repeat(60));
    
    // 1일이 월요일인 경우들 찾기
    console.log('\n📌 1일이 월요일인 경우 (월간 vs 주간 충돌):');
    console.log('─'.repeat(60));
    
    for (let year = 2025; year <= 2026; year++) {
        for (let month = 0; month < 12; month++) {
            const date = new Date(year, month, 1);
            if (date.getDay() === 1) { // 월요일
                const reportType = determineReportType(date);
                console.log(`${year}년 ${month + 1}월 1일 월요일 → ${reportType} 보고서 ✅`);
            }
        }
    }
    
    // 1일이 주말인 경우들 찾기
    console.log('\n📌 1일이 주말인 경우 (자동 실행 안 됨):');
    console.log('─'.repeat(60));
    
    for (let month = 0; month < 12; month++) {
        const date = new Date(2025, month, 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const dayName = getDayName(dayOfWeek);
            const reportType = determineReportType(date);
            console.log(`2025년 ${month + 1}월 1일 ${dayName}요일 → ${reportType}`);
        }
    }
}

function calculateYearlyStats() {
    console.log('\n\n📈 2025년 연간 보고서 통계');
    console.log('═'.repeat(60));
    
    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let skipCount = 0;
    
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2025, 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const reportType = determineReportType(new Date(d));
        
        switch(reportType) {
            case '일간':
                dailyCount++;
                break;
            case '주간':
                weeklyCount++;
                break;
            case '월간':
                monthlyCount++;
                break;
            case 'SKIP (주말)':
                skipCount++;
                break;
        }
    }
    
    const totalReports = dailyCount + weeklyCount + monthlyCount;
    const totalDays = 365;
    const weekdays = totalDays - skipCount;
    
    console.log(`\n📊 전체 통계:`);
    console.log(`  • 전체 일수: ${totalDays}일`);
    console.log(`  • 평일: ${weekdays}일`);
    console.log(`  • 주말: ${skipCount}일`);
    
    console.log(`\n📋 보고서 생성 횟수:`);
    console.log(`  • 일간 보고서: ${dailyCount}회`);
    console.log(`  • 주간 보고서: ${weeklyCount}회`);
    console.log(`  • 월간 보고서: ${monthlyCount}회`);
    console.log(`  • 총 보고서: ${totalReports}회`);
    
    console.log(`\n📈 비율:`);
    console.log(`  • 일간: ${(dailyCount/weekdays*100).toFixed(1)}%`);
    console.log(`  • 주간: ${(weeklyCount/weekdays*100).toFixed(1)}%`);
    console.log(`  • 월간: ${(monthlyCount/weekdays*100).toFixed(1)}%`);
}

// 실행
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║          보고서 우선순위 로직 테스트 시스템            ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

testYear2025();
testSpecialCases();
calculateYearlyStats();

console.log('\n✅ 테스트 완료\n');