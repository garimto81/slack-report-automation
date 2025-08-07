#!/usr/bin/env node

/**
 * 자동화 시스템 디버깅 스크립트
 * GitHub Actions에서 발생할 수 있는 문제들을 체계적으로 확인
 */

require('dotenv').config();
const { google } = require('googleapis');

async function debugAutomation() {
    console.log('🔍 자동화 시스템 디버깅 시작');
    console.log('=' .repeat(60));
    
    // 1. 환경변수 확인
    console.log('📋 환경변수 확인:');
    console.log('─'.repeat(30));
    
    const requiredEnvs = [
        'SLACK_BOT_TOKEN',
        'SLACK_CHANNEL_ID', 
        'GOOGLE_SERVICE_ACCOUNT_KEY',
        'GOOGLE_DOCS_ID',
        'GEMINI_API_KEY'
    ];
    
    let envIssues = 0;
    requiredEnvs.forEach(envVar => {
        const value = process.env[envVar];
        if (value) {
            console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? '***키 존재***' : value}`);
        } else {
            console.log(`❌ ${envVar}: 누락`);
            envIssues++;
        }
    });
    
    if (envIssues > 0) {
        console.log(`\n⚠️ ${envIssues}개 환경변수가 누락되었습니다.`);
        return;
    }
    
    console.log('\n✅ 모든 환경변수 확인됨\n');
    
    // 2. Google Service Account 키 검증
    console.log('🔐 Google Service Account 키 검증:');
    console.log('─'.repeat(30));
    
    try {
        const serviceKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        console.log(`✅ 프로젝트 ID: ${serviceKey.project_id}`);
        console.log(`✅ 클라이언트 이메일: ${serviceKey.client_email}`);
        console.log(`✅ Private Key: ${serviceKey.private_key ? '존재' : '누락'}`);
        
        // 3. Google 인증 테스트
        console.log('\n🔐 Google API 인증 테스트:');
        console.log('─'.repeat(30));
        
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const client = await auth.getClient();
        console.log('✅ Google API 인증 성공');
        
        // 4. 구글 문서 접근 테스트
        console.log('\n📄 구글 문서 접근 테스트:');
        console.log('─'.repeat(30));
        
        const docs = google.docs({ version: 'v1', auth: client });
        const documentId = process.env.GOOGLE_DOCS_ID;
        
        console.log(`📋 문서 ID: ${documentId}`);
        
        try {
            const document = await docs.documents.get({ documentId });
            console.log(`✅ 문서 제목: "${document.data.title}"`);
            console.log(`✅ 문서 접근 성공 (읽기 권한 확인)`);
            
            // 5. 테이블 구조 확인
            console.log('\n📊 테이블 구조 확인:');
            console.log('─'.repeat(30));
            
            const content = document.data.body.content || [];
            let tableElement = null;
            
            content.forEach((element) => {
                if (element.table && !tableElement) {
                    tableElement = element;
                }
            });
            
            if (tableElement) {
                const rows = tableElement.table.tableRows || [];
                console.log(`✅ 테이블 발견: ${rows.length}행 × ${rows[0]?.tableCells?.length || 0}열`);
                
                // 헤더 확인
                const headers = rows[0]?.tableCells?.map(cell => extractCellText(cell)) || [];
                console.log('\n📋 테이블 헤더:');
                headers.forEach((header, index) => {
                    console.log(`  ${index + 1}. ${header}`);
                });
                
                // 카메라 행 찾기
                console.log('\n🔍 카메라 파트 검색:');
                let cameraRowIndex = -1;
                rows.forEach((row, rowIndex) => {
                    const firstCell = extractCellText(row.tableCells[0]);
                    if (firstCell === '카메라') {
                        cameraRowIndex = rowIndex;
                        console.log(`✅ 카메라 파트 발견: 행 ${rowIndex + 1}`);
                    }
                });
                
                if (cameraRowIndex === -1) {
                    console.log('❌ 카메라 파트를 찾을 수 없음');
                } else {
                    // 카메라 행의 현재 데이터 출력
                    console.log('\n📊 카메라 파트 현재 데이터:');
                    const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
                    const coreContentCol = headers.indexOf('핵심 내용(방향성)');
                    
                    for (let i = 0; i < 3; i++) {
                        const rowIndex = cameraRowIndex + i;
                        if (rowIndex < rows.length) {
                            const row = rows[rowIndex];
                            console.log(`\n행 ${rowIndex + 1}:`);
                            if (taskNameCol !== -1) {
                                const taskName = extractCellText(row.tableCells[taskNameCol]);
                                console.log(`  업무명: "${taskName}"`);
                            }
                            if (coreContentCol !== -1) {
                                const coreContent = extractCellText(row.tableCells[coreContentCol]);
                                console.log(`  핵심내용: "${coreContent}"`);
                            }
                        }
                    }
                }
                
            } else {
                console.log('❌ 테이블을 찾을 수 없음');
            }
            
            // 6. 쓰기 권한 테스트 (실제 수정하지 않고 테스트)
            console.log('\n✏️ 쓰기 권한 테스트:');
            console.log('─'.repeat(30));
            
            try {
                // 빈 요청으로 batchUpdate API 테스트
                const testResponse = await docs.documents.batchUpdate({
                    documentId: documentId,
                    requestBody: { requests: [] }
                });
                
                console.log('✅ 쓰기 권한 확인 (batchUpdate API 접근 가능)');
                
            } catch (writeError) {
                console.log('❌ 쓰기 권한 오류:', writeError.message);
                if (writeError.code === 403) {
                    console.log('🔧 해결방법: Service Account에 문서 편집 권한을 부여하세요');
                    console.log(`   이메일: ${serviceKey.client_email}`);
                }
            }
            
        } catch (docError) {
            console.log('❌ 문서 접근 오류:', docError.message);
            if (docError.code === 404) {
                console.log('🔧 해결방법: 문서 ID가 올바른지 확인하세요');
            } else if (docError.code === 403) {
                console.log('🔧 해결방법: Service Account에 문서 접근 권한을 부여하세요');
                console.log(`   이메일: ${serviceKey.client_email}`);
            }
        }
        
    } catch (keyError) {
        console.log('❌ Service Account 키 파싱 오류:', keyError.message);
    }
    
    // 7. Slack API 테스트
    console.log('\n📡 Slack API 연결 테스트:');
    console.log('─'.repeat(30));
    
    try {
        const { SlackApi } = require('./slack-api');
        const slackApi = new SlackApi();
        const connected = await slackApi.testConnection();
        
        if (connected) {
            console.log('✅ Slack API 연결 성공');
        } else {
            console.log('❌ Slack API 연결 실패');
        }
    } catch (slackError) {
        console.log('❌ Slack API 오류:', slackError.message);
    }
    
    console.log('\n🎯 디버깅 완료!');
    console.log('\n💡 문제 해결 가이드:');
    console.log('─'.repeat(30));
    console.log('1. Service Account 이메일을 구글 문서에 편집자로 공유');
    console.log('2. 환경변수가 모두 올바르게 설정되었는지 확인');
    console.log('3. 문서 ID와 테이블 구조가 올바른지 확인');
}

// 셀에서 텍스트 추출 유틸리티
function extractCellText(cell) {
    let text = '';
    const content = cell.content || [];
    
    content.forEach(paragraph => {
        if (paragraph.paragraph) {
            const elements = paragraph.paragraph.elements || [];
            elements.forEach(elem => {
                if (elem.textRun && elem.textRun.content) {
                    text += elem.textRun.content;
                }
            });
        }
    });
    
    return text.trim();
}

// 실행
if (require.main === module) {
    debugAutomation().catch(error => {
        console.error('❌ 디버깅 오류:', error);
        process.exit(1);
    });
}

module.exports = { debugAutomation };