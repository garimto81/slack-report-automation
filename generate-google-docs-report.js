#!/usr/bin/env node

/**
 * Google Docs 업데이트 전용 실행 스크립트
 * 기존 Slack 보고 로직과 독립적으로 실행되는 Google Docs 업데이트
 */

const { updateGoogleDocs } = require('./google-docs-updater');

/**
 * 메인 실행 함수
 */
async function main() {
    console.log('🚀 Google Docs 업데이트 스크립트 시작');
    console.log('=' .repeat(50));
    
    // 명령행 인자 처리
    const args = process.argv.slice(2);
    const reportType = args[0] || 'daily';
    
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
    
    console.log(`📊 보고서 타입: ${reportType}`);
    console.log(`🕐 실행 시간: ${new Date().toLocaleString('ko-KR')}`);
    console.log('');
    
    try {
        // Google Docs 업데이트 실행
        const result = await updateGoogleDocs(reportType, {
            minTaskCount: 3, // 최소 3개 업무 확보
            documentId: process.env.GOOGLE_DOCS_ID, // 선택사항
            shareEmails: process.env.GOOGLE_DOCS_SHARE_EMAILS?.split(',') // 선택사항
        });
        
        if (result.success) {
            console.log('🎉 Google Docs 업데이트 성공!');
            console.log('─'.repeat(30));
            console.log(`📝 제목: ${result.title}`);
            console.log(`📋 업무 개수: ${result.tasksCount}개`);
            console.log(`📊 사용된 보고서: ${result.reportType}`);
            
            if (result.expandedFrom) {
                console.log(`📈 확장: ${result.expandedFrom} → ${result.reportType}`);
            }
            
            if (result.documentUrl) {
                console.log(`🔗 문서 링크: ${result.documentUrl}`);
            }
            
            console.log('✅ 처리 완료');
            
        } else {
            console.error('❌ Google Docs 업데이트 실패');
            console.error(`오류: ${result.message || result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 실행 중 오류 발생:', error.message);
        console.error('스택:', error.stack);
        process.exit(1);
    }
}

/**
 * 스크립트 직접 실행 시
 */
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 예상치 못한 오류:', error);
        process.exit(1);
    });
}

module.exports = { main };