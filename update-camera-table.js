#!/usr/bin/env node

/**
 * 카메라 테이블 업데이트 메인 스크립트
 * 오늘 날짜 탭을 찾아서 카메라 헤더가 있는 테이블을 업데이트
 */

const { ensureMinimumTasks } = require('./minimum-tasks-algorithm');
const { processTopTasks } = require('./top-tasks-processor');
const { findCameraTableInDocument } = require('./google-docs-table-finder');
const { updateCameraTable } = require('./google-docs-table-updater');

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('🚀 카메라 테이블 업데이트 시작');
    console.log('=' .repeat(60));
    
    // 명령행 인자 처리
    const args = process.argv.slice(2);
    const reportType = args[0] || 'daily';
    const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
    
    console.log(`📊 보고서 타입: ${reportType}`);
    console.log(`📄 문서 ID: ${documentId}`);
    console.log(`🕐 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
    console.log('');
    
    // 환경 변수 확인
    const requiredEnvVars = [
        'SLACK_BOT_TOKEN',
        'SLACK_CHANNEL_ID', 
        'GEMINI_API_KEY',
        'GOOGLE_SERVICE_ACCOUNT_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error('❌ 필수 환경 변수가 없습니다:', missingVars.join(', '));
        process.exit(1);
    }
    
    try {
        // 1단계: 최소 업무 확보 (기존 로직 활용)
        console.log('🎯 1단계: 최소 업무 개수 확보');
        console.log('─'.repeat(40));
        
        const taskResult = await ensureMinimumTasks(reportType, 3);
        
        if (!taskResult.tasks || taskResult.tasks.length === 0) {
            console.error('❌ 업무 데이터를 가져올 수 없습니다.');
            process.exit(1);
        }
        
        console.log(`✅ 업무 확보 완료: ${taskResult.tasksCount}개`);
        if (taskResult.expandedFrom) {
            console.log(`📈 보고서 타입 확장: ${taskResult.expandedFrom} → ${taskResult.reportType}`);
        }
        console.log('');
        
        // 2단계: 상위 3개 업무 추출 및 핵심 내용 생성
        console.log('🎯 2단계: 상위 3개 업무 추출 및 핵심 내용 생성');
        console.log('─'.repeat(40));
        
        const processResult = await processTopTasks(taskResult.tasks, taskResult.reportType);
        
        if (!processResult.success || processResult.tasks.length === 0) {
            console.error('❌ 상위 업무 처리에 실패했습니다.');
            process.exit(1);
        }
        
        console.log(`✅ 상위 3개 업무 처리 완료`);
        processResult.tasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.taskName}`);
            console.log(`   → ${task.coreContent}`);
        });
        console.log('');
        
        // 3단계: 구글 문서에서 카메라 테이블 찾기
        console.log('🎯 3단계: 구글 문서에서 카메라 테이블 찾기');
        console.log('─'.repeat(40));
        
        const findResult = await findCameraTableInDocument(documentId);
        
        if (!findResult.success) {
            console.error('❌ 카메라 테이블을 찾을 수 없습니다.');
            console.error(`세부사항: ${findResult.message}`);
            
            if (findResult.availableTabs) {
                console.log('\n📋 사용 가능한 탭 목록:');
                findResult.availableTabs.forEach((tab, index) => {
                    console.log(`${index + 1}. "${tab.title}"`);
                });
            }
            
            process.exit(1);
        }
        
        console.log(`✅ 카메라 테이블 발견!`);
        console.log(`📑 탭: "${findResult.tab.title}"`);
        console.log(`📊 테이블 위치: 행 ${findResult.table.cameraRowIndex + 1}부터 3개 행`);
        console.log('');
        
        // 4단계: 카메라 테이블 업데이트
        console.log('🎯 4단계: 카메라 테이블 업데이트');
        console.log('─'.repeat(40));
        
        const updateResult = await updateCameraTable(
            documentId,
            findResult.table,
            processResult.tasks
        );
        
        if (!updateResult.success) {
            console.error('❌ 테이블 업데이트에 실패했습니다.');
            console.error(`세부사항: ${updateResult.message}`);
            process.exit(1);
        }
        
        console.log(`✅ 테이블 업데이트 완료!`);
        console.log(`📝 업데이트된 셀: ${updateResult.updatedCells}개`);
        console.log(`📋 업데이트된 업무: ${updateResult.tasksUpdated}개`);
        console.log('');
        
        // 최종 결과 요약
        console.log('🎉 카메라 테이블 업데이트 완료!');
        console.log('=' .repeat(60));
        console.log(`📊 처리된 보고서 타입: ${taskResult.reportType}`);
        console.log(`📋 총 업무 수: ${taskResult.tasksCount}개 → 상위 3개 선별`);
        console.log(`📑 업데이트된 탭: "${findResult.tab.title}"`);
        console.log(`🔗 문서 링크: https://docs.google.com/document/d/${documentId}/edit`);
        
        console.log('\n📝 업데이트된 내용:');
        processResult.tasks.forEach((task, index) => {
            console.log(`${index + 1}. 업무명: ${task.taskName}`);
            console.log(`   핵심내용: ${task.coreContent}`);
            console.log('');
        });
        
        console.log('✅ 모든 처리 완료!');
        
    } catch (error) {
        console.error('❌ 실행 중 오류 발생:', error.message);
        console.error('스택:', error.stack);
        process.exit(1);
    }
}

/**
 * 테스트 실행 함수 (안전한 테스트용)
 */
async function testRun() {
    console.log('🧪 테스트 모드: 카메라 테이블 찾기만 수행');
    console.log('=' .repeat(50));
    
    const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
    
    try {
        // 테스트 1: 오늘 날짜 탭 찾기
        const findResult = await findCameraTableInDocument(documentId);
        
        if (findResult.success) {
            console.log('✅ 테스트 성공: 카메라 테이블을 찾았습니다!');
            console.log(`📑 탭: "${findResult.tab.title}"`);
            console.log(`📊 테이블: 행 ${findResult.table.cameraRowIndex + 1}부터`);
            
            // 헤더 구조 출력
            const headers = findResult.table.headerStructure.headers;
            console.log('\n📋 발견된 헤더 구조:');
            headers.forEach((header, index) => {
                console.log(`${index + 1}. "${header}"`);
            });
            
        } else {
            console.log('❌ 테스트 실패: 카메라 테이블을 찾을 수 없습니다.');
            console.log(`세부사항: ${findResult.message}`);
            
            if (findResult.availableTabs) {
                console.log('\n📋 사용 가능한 탭:');
                findResult.availableTabs.forEach(tab => {
                    console.log(`- "${tab.title}"`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ 테스트 중 오류:', error.message);
    }
}

/**
 * 스크립트 직접 실행 시
 */
if (require.main === module) {
    const testMode = process.argv.includes('--test');
    
    if (testMode) {
        testRun().catch(console.error);
    } else {
        main().catch(error => {
            console.error('❌ 예상치 못한 오류:', error);
            process.exit(1);
        });
    }
}

module.exports = { main, testRun };