/**
 * 첫째주 월요일 판단 로직 테스트
 * 매월 첫째주 월요일을 찾는 알고리즘 검증
 */

function isFirstMondayOfMonth(date) {
    // 월요일인지 확인 (1 = 월요일)
    if (date.getDay() !== 1) {
        return false;
    }
    
    // 날짜가 1-7일 사이인지 확인 (첫째주)
    const dayOfMonth = date.getDate();
    return dayOfMonth >= 1 && dayOfMonth <= 7;
}

function getFirstMondayOfMonth(year, month) {
    // 매월 1일부터 7일까지 확인
    for (let day = 1; day <= 7; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 1) { // 월요일
            return date;
        }
    }
    return null;
}

function test2025() {
    console.log('📅 2025년 각 월의 첫째주 월요일');
    console.log('═'.repeat(50));
    console.log('\n월\t첫째주 월요일\t날짜');
    console.log('─'.repeat(50));
    
    const months = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    for (let month = 0; month < 12; month++) {
        const firstMonday = getFirstMondayOfMonth(2025, month);
        if (firstMonday) {
            console.log(`${months[month]}\t${firstMonday.getDate()}일\t\t${firstMonday.toLocaleDateString('ko-KR')}`);
        }
    }
}

function determineReportType(date) {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    
    // 주말 체크
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'SKIP (주말)';
    }
    
    // 우선순위: 월간 (첫째주 월요일) > 주간 (월요일) > 일간
    if (dayOfWeek === 1 && dayOfMonth <= 7) {
        return '월간 (첫째주 월요일)';
    } else if (dayOfWeek === 1) {
        return '주간';
    } else {
        return '일간';
    }
}

function calculateYearlyStats2025() {
    console.log('\n\n📊 2025년 보고서 통계 (첫째주 월요일 기준)');
    console.log('═'.repeat(50));
    
    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let skipCount = 0;
    
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2025, 11, 31);
    
    const monthlyDates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const reportType = determineReportType(new Date(d));
        
        switch(reportType) {
            case '일간':
                dailyCount++;
                break;
            case '주간':
                weeklyCount++;
                break;
            case '월간 (첫째주 월요일)':
                monthlyCount++;
                monthlyDates.push(new Date(d));
                break;
            case 'SKIP (주말)':
                skipCount++;
                break;
        }
    }
    
    const totalReports = dailyCount + weeklyCount + monthlyCount;
    const totalDays = 365;
    const weekdays = totalDays - skipCount;
    
    console.log(`\n📋 월간 보고서 날짜 (${monthlyCount}회):`);
    monthlyDates.forEach(date => {
        console.log(`  • ${date.toLocaleDateString('ko-KR')}`);
    });
    
    console.log(`\n📊 전체 통계:`);
    console.log(`  • 전체 일수: ${totalDays}일`);
    console.log(`  • 평일: ${weekdays}일`);
    console.log(`  • 주말: ${skipCount}일`);
    
    console.log(`\n📈 보고서 생성 횟수:`);
    console.log(`  • 일간 보고서: ${dailyCount}회`);
    console.log(`  • 주간 보고서: ${weeklyCount}회`);
    console.log(`  • 월간 보고서: ${monthlyCount}회`);
    console.log(`  • 총 보고서: ${totalReports}회`);
    
    console.log(`\n📊 비율:`);
    console.log(`  • 일간: ${(dailyCount/weekdays*100).toFixed(1)}%`);
    console.log(`  • 주간: ${(weeklyCount/weekdays*100).toFixed(1)}%`);
    console.log(`  • 월간: ${(monthlyCount/weekdays*100).toFixed(1)}%`);
}

function testSpecialCases() {
    console.log('\n\n🎯 특수 케이스 확인');
    console.log('═'.repeat(50));
    
    console.log('\n📌 첫째주 월요일이 1일인 경우:');
    console.log('─'.repeat(50));
    
    // 2025-2026년에서 첫째주 월요일이 정확히 1일인 경우 찾기
    for (let year = 2025; year <= 2026; year++) {
        for (let month = 0; month < 12; month++) {
            const firstMonday = getFirstMondayOfMonth(year, month);
            if (firstMonday && firstMonday.getDate() === 1) {
                console.log(`${year}년 ${month + 1}월 1일 월요일 - 월간 보고서`);
            }
        }
    }
    
    console.log('\n📌 첫째주 월요일이 7일인 경우:');
    console.log('─'.repeat(50));
    
    // 첫째주 월요일이 7일인 경우 (일요일이 1일)
    for (let year = 2025; year <= 2026; year++) {
        for (let month = 0; month < 12; month++) {
            const firstMonday = getFirstMondayOfMonth(year, month);
            if (firstMonday && firstMonday.getDate() === 7) {
                console.log(`${year}년 ${month + 1}월 7일 월요일 - 월간 보고서`);
            }
        }
    }
}

// 실행
console.log('╔══════════════════════════════════════════════════╗');
console.log('║     첫째주 월요일 월간 보고 로직 테스트         ║');
console.log('╚══════════════════════════════════════════════════╝\n');

test2025();
calculateYearlyStats2025();
testSpecialCases();

console.log('\n✅ 테스트 완료\n');