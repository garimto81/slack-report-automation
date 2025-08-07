#!/usr/bin/env node

/**
 * 강화된 카메라 파트 업데이트 (혼재 상황 완벽 처리)
 */

require('dotenv').config();
const { google } = require('googleapis');

async function robustCameraUpdate() {
    console.log('🎯 강화된 카메라 파트 업데이트');
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
        const documentId = process.env.GOOGLE_DOCS_ID;
        
        console.log('✅ 인증 성공\n');
        
        // 실제 Slack 데이터 대신 현재 테스트용 데이터
        const newCameraTasks = [
            {
                taskName: 'WSOP 카메라 설정 최적화',
                coreContent: '키프로스 토너먼트를 위한 멀티 카메라 앵글 및 화질 설정 최적화'
            },
            {
                taskName: '라이브 스트리밍 안정화',
                coreContent: '실시간 방송 품질 향상을 위한 네트워크 및 인코딩 최적화'
            },
            {
                taskName: '촬영장비 유지보수',
                coreContent: '카메라 렌즈 청소, 배터리 점검 및 메모리 카드 관리'
            }
        ];
        
        // 문서 가져오기
        const document = await docs.documents.get({ documentId });
        console.log(`📄 문서: "${document.data.title}"`);
        
        // 테이블 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
            }
        });
        
        if (!tableElement) {
            throw new Error('테이블을 찾을 수 없습니다.');
        }
        
        const rows = tableElement.table.tableRows || [];
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        const coreContentCol = headers.indexOf('핵심 내용(방향성)');
        const progressCol = headers.indexOf('진행사항');
        const linkCol = headers.indexOf('문서 링크');
        
        console.log(`📋 컬럼 위치: 업무명(${taskNameCol + 1}), 핵심내용(${coreContentCol + 1}), 진행사항(${progressCol + 1}), 링크(${linkCol + 1})\n`);
        
        const requests = [];
        const cameraRows = [21, 22, 23]; // 0-based index for rows 22, 23, 24
        
        // 각 행 처리
        cameraRows.forEach((rowIndex, idx) => {
            if (rowIndex < rows.length && idx < newCameraTasks.length) {
                const row = rows[rowIndex];
                const taskData = newCameraTasks[idx];
                
                console.log(`📝 행 ${rowIndex + 1} 처리: "${taskData.taskName}"`);
                
                // 업무명 처리
                if (taskNameCol !== -1) {
                    const result = processCellUpdate(
                        row.tableCells[taskNameCol], 
                        taskData.taskName, 
                        `행 ${rowIndex + 1} 업무명`
                    );
                    if (result) requests.push(result);
                }
                
                // 핵심내용 처리
                if (coreContentCol !== -1) {
                    const result = processCellUpdate(
                        row.tableCells[coreContentCol], 
                        taskData.coreContent, 
                        `행 ${rowIndex + 1} 핵심내용`
                    );
                    if (result) requests.push(result);
                }
                
                // 진행사항 처리 (항상 50%)
                if (progressCol !== -1) {
                    const result = processCellUpdate(
                        row.tableCells[progressCol], 
                        '50%', 
                        `행 ${rowIndex + 1} 진행사항`
                    );
                    if (result) requests.push(result);
                }
                
                // 문서 링크 삭제
                if (linkCol !== -1) {
                    const linkCell = row.tableCells[linkCol];
                    const currentLink = extractCellText(linkCell);
                    
                    if (currentLink.length > 0) {
                        console.log(`  🔗 링크 삭제: "${currentLink}"`);
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentLink, matchCase: false },
                                replaceText: ''
                            }
                        });
                    }
                }
                
                console.log(''); // 빈 줄
            }
        });
        
        // 업데이트 실행
        if (requests.length > 0) {
            console.log(`🚀 ${requests.length}개 요청 실행 중...`);
            
            // 요청을 작은 단위로 나누어 실행 (안정성 향상)
            const batchSize = 10;
            let successCount = 0;
            
            for (let i = 0; i < requests.length; i += batchSize) {
                const batch = requests.slice(i, i + batchSize);
                
                try {
                    const response = await docs.documents.batchUpdate({
                        documentId: documentId,
                        requestBody: { requests: batch }
                    });
                    
                    successCount += batch.length;
                    console.log(`  ✅ 배치 ${Math.floor(i/batchSize) + 1}: ${batch.length}개 완료`);
                    
                } catch (batchError) {
                    console.error(`  ❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, batchError.message);
                }
            }
            
            console.log(`\n✅ 총 ${successCount}/${requests.length}개 요청 처리 완료!`);
            
        } else {
            console.log('⚠️ 처리할 요청이 없습니다.');
        }
        
        // 결과 확인
        console.log('\n📊 업데이트된 업무 목록:');
        console.log('─'.repeat(50));
        newCameraTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.taskName}`);
            console.log(`   └─ ${task.coreContent}`);
            console.log(`   └─ 진행률: 50%`);
        });
        
        console.log('\n🎉 강화된 카메라 파트 업데이트 성공!');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

/**
 * 셀 업데이트 처리 (빈 셀/기존 텍스트 자동 판단)
 */
function processCellUpdate(cell, newText, description) {
    if (!cell || !newText) return null;
    
    try {
        const currentText = extractCellText(cell);
        const elements = cell.content[0]?.paragraph?.elements || [];
        
        console.log(`  📝 ${description}: "${currentText}" → "${newText}"`);
        
        if (currentText.length === 0) {
            // 빈 셀 - insertText 사용
            if (elements.length > 0 && elements[0].startIndex !== undefined) {
                console.log(`    방법: insertText (빈 셀)`);
                return {
                    insertText: {
                        location: { index: elements[0].startIndex },
                        text: newText
                    }
                };
            } else {
                console.log(`    ⚠️ 스킵: 유효한 인덱스 없음`);
                return null;
            }
        } else {
            // 기존 텍스트 - replaceAllText 사용
            console.log(`    방법: replaceAllText (기존 텍스트)`);
            return {
                replaceAllText: {
                    containsText: { text: currentText, matchCase: false },
                    replaceText: newText
                }
            };
        }
    } catch (error) {
        console.log(`    ❌ 처리 실패: ${error.message}`);
        return null;
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
    robustCameraUpdate().catch(console.error);
}

module.exports = { robustCameraUpdate };