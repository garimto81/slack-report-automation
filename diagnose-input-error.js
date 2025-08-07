#!/usr/bin/env node

/**
 * 구글 문서 입력 오류 진단 도구
 */

require('dotenv').config();
const { google } = require('googleapis');

async function diagnoseInputError() {
    console.log('🔍 구글 문서 입력 오류 진단 시작');
    console.log('=' .repeat(60));
    
    try {
        // Google 인증
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const client = await auth.getClient();
        const docs = google.docs({ version: 'v1', auth: client });
        const drive = google.drive({ version: 'v3', auth: client });
        const documentId = process.env.GOOGLE_DOCS_ID;
        
        console.log(`📋 문서 ID: ${documentId}`);
        console.log('✅ 인증 성공\n');
        
        // 1. 기본 문서 접근 테스트
        console.log('📄 1단계: 기본 문서 접근 테스트');
        console.log('─'.repeat(40));
        
        const document = await docs.documents.get({ documentId });
        const revisionId = document.data.revisionId;
        
        console.log(`✅ 문서 제목: "${document.data.title}"`);
        console.log(`✅ 현재 리비전 ID: ${revisionId}`);
        console.log(`✅ 문서 길이: ${document.data.body.content?.length || 0}개 요소\n`);
        
        // 2. Drive 권한 확인
        console.log('🔐 2단계: Drive 권한 확인');
        console.log('─'.repeat(40));
        
        try {
            const fileInfo = await drive.files.get({
                fileId: documentId,
                fields: 'permissions,capabilities'
            });
            
            console.log('✅ Drive API 접근 성공');
            const capabilities = fileInfo.data.capabilities || {};
            console.log(`  편집 가능: ${capabilities.canEdit ? '✅' : '❌'}`);
            console.log(`  댓글 가능: ${capabilities.canComment ? '✅' : '❌'}`);
            console.log(`  공유 가능: ${capabilities.canShare ? '✅' : '❌'}`);
            
        } catch (driveError) {
            console.log('❌ Drive API 접근 실패:', driveError.message);
            console.log('💡 권한 문제일 가능성 높음');
        }
        
        console.log('');
        
        // 3. 테스트 업데이트 (revision 추적)
        console.log('🧪 3단계: 테스트 업데이트 (revision 추적)');
        console.log('─'.repeat(40));
        
        // 카메라 셀 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
            }
        });
        
        if (!tableElement) {
            console.log('❌ 테이블을 찾을 수 없습니다.');
            return;
        }
        
        const rows = tableElement.table.tableRows || [];
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        
        console.log(`📊 테이블: ${rows.length}행 × ${rows[0]?.tableCells?.length || 0}열`);
        console.log(`📋 업무명 열 위치: ${taskNameCol + 1}번째\n`);
        
        if (taskNameCol === -1) {
            console.log('❌ 업무명 열을 찾을 수 없습니다.');
            return;
        }
        
        // 카메라 행 22 찾기
        const cameraRowIndex = 21; // 0-based
        const cameraRow = rows[cameraRowIndex];
        const taskCell = cameraRow.tableCells[taskNameCol];
        
        const currentText = extractCellText(taskCell);
        const elements = taskCell.content[0]?.paragraph?.elements || [];
        
        console.log(`🔍 행 22 현재 상태:`);
        console.log(`  현재 텍스트: "${currentText}"`);
        console.log(`  텍스트 길이: ${currentText.length}`);
        console.log(`  Elements 개수: ${elements.length}`);
        
        if (elements.length > 0) {
            console.log(`  첫 번째 element startIndex: ${elements[0].startIndex}`);
            console.log(`  첫 번째 element endIndex: ${elements[0].endIndex}`);
        }
        
        // 테스트 업데이트 요청 생성
        const testText = `테스트 업데이트 ${new Date().getTime()}`;
        let testRequest;
        
        if (currentText.length === 0) {
            console.log('\n🔧 빈 셀 테스트: insertText 사용');
            if (elements.length > 0) {
                testRequest = {
                    insertText: {
                        location: { index: elements[0].startIndex },
                        text: testText
                    }
                };
            }
        } else {
            console.log('\n🔧 기존 텍스트 테스트: replaceAllText 사용');
            testRequest = {
                replaceAllText: {
                    containsText: { text: currentText, matchCase: false },
                    replaceText: testText
                }
            };
        }
        
        if (!testRequest) {
            console.log('❌ 테스트 요청을 생성할 수 없습니다.');
            return;
        }
        
        // 4. 실제 업데이트 실행 및 추적
        console.log('\n🚀 4단계: 실제 업데이트 실행 및 추적');
        console.log('─'.repeat(40));
        
        console.log(`업데이트 전 리비전 ID: ${revisionId}`);
        
        try {
            const updateResponse = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: [testRequest]
                }
            });
            
            console.log('✅ batchUpdate 호출 성공');
            console.log(`  응답 상태: ${updateResponse.status || 'OK'}`);
            console.log(`  처리된 요청: ${updateResponse.data.replies?.length || 0}개`);
            
            // 응답 상세 정보
            if (updateResponse.data.replies) {
                updateResponse.data.replies.forEach((reply, index) => {
                    console.log(`  요청 ${index + 1} 응답:`, JSON.stringify(reply, null, 2));
                });
            }
            
        } catch (updateError) {
            console.log('❌ batchUpdate 실패:', updateError.message);
            
            if (updateError.code === 400) {
                console.log('💡 400 오류: API 요청 형식 문제');
                console.log('   - 인덱스가 유효하지 않거나');
                console.log('   - 텍스트 범위가 잘못되었을 수 있음');
            } else if (updateError.code === 403) {
                console.log('💡 403 오류: 권한 문제');
                console.log('   - Service Account에 편집 권한이 없음');
                console.log('   - 문서 공유 설정 확인 필요');
            }
            
            return;
        }
        
        // 5. 변경사항 확인
        console.log('\n📊 5단계: 변경사항 확인');
        console.log('─'.repeat(40));
        
        // 잠시 대기 (Google Docs 동기화 시간)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedDocument = await docs.documents.get({ documentId });
        const newRevisionId = updatedDocument.data.revisionId;
        
        console.log(`업데이트 후 리비전 ID: ${newRevisionId}`);
        console.log(`리비전 변경 여부: ${revisionId !== newRevisionId ? '✅ 변경됨' : '❌ 변경 없음'}`);
        
        // 업데이트된 셀 내용 확인
        const updatedContent = updatedDocument.data.body.content || [];
        let updatedTable = null;
        
        updatedContent.forEach((element) => {
            if (element.table && !updatedTable) {
                updatedTable = element;
            }
        });
        
        const updatedRows = updatedTable.table.tableRows || [];
        const updatedRow = updatedRows[cameraRowIndex];
        const updatedCell = updatedRow.tableCells[taskNameCol];
        const updatedText = extractCellText(updatedCell);
        
        console.log(`업데이트된 텍스트: "${updatedText}"`);
        
        if (updatedText === testText) {
            console.log('✅ 업데이트 성공! 텍스트가 정확히 변경됨');
        } else if (updatedText === currentText) {
            console.log('❌ 업데이트 실패: 텍스트가 변경되지 않음');
            console.log('🔧 가능한 원인:');
            console.log('   1. 권한 문제: 읽기 권한만 있고 쓰기 권한 없음');
            console.log('   2. 인덱스 문제: 잘못된 위치에 업데이트 시도');
            console.log('   3. 문서 잠금: 다른 사용자가 편집 중');
            console.log('   4. API 제한: 일시적인 제한 상태');
        } else {
            console.log('⚠️ 예상치 못한 결과: 다른 텍스트로 변경됨');
        }
        
        // 6. 원상복구 (테스트이므로)
        console.log('\n🔄 6단계: 테스트 원상복구');
        console.log('─'.repeat(40));
        
        if (updatedText === testText && currentText.length > 0) {
            try {
                await docs.documents.batchUpdate({
                    documentId: documentId,
                    requestBody: {
                        requests: [{
                            replaceAllText: {
                                containsText: { text: testText, matchCase: false },
                                replaceText: currentText
                            }
                        }]
                    }
                });
                console.log('✅ 원상복구 완료');
            } catch (restoreError) {
                console.log('⚠️ 원상복구 실패:', restoreError.message);
            }
        }
        
        console.log('\n🎯 진단 완료!');
        
    } catch (error) {
        console.error('❌ 진단 도구 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// 셀에서 텍스트 추출
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
    diagnoseInputError().catch(console.error);
}

module.exports = { diagnoseInputError };