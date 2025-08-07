#!/usr/bin/env node

/**
 * 빈 셀을 처리하는 카메라 파트 업데이트
 */

require('dotenv').config();
const { google } = require('googleapis');

async function updateEmptyCells() {
    console.log('🎯 빈 셀 처리용 카메라 파트 업데이트');
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
        
        // 새로운 카메라 업무 데이터
        const cameraData = [
            {
                taskName: '카메라 장비 정기 점검',
                coreContent: '렌즈 청소 및 초점 조정으로 화질 개선 작업'
            },
            {
                taskName: 'PTZ 카메라 설치',
                coreContent: '원격 제어 가능한 PTZ 카메라 2대 설치 작업'
            },
            {
                taskName: '스트리밍 품질 개선',
                coreContent: '비트레이트 최적화 및 인코딩 설정 개선'
            }
        ];
        
        // 문서 가져오기
        const document = await docs.documents.get({ documentId });
        
        // 테이블 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
            }
        });
        
        const rows = tableElement.table.tableRows || [];
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        const coreContentCol = headers.indexOf('핵심 내용(방향성)');
        const progressCol = headers.indexOf('진행사항');
        
        console.log(`📋 업무명 열: ${taskNameCol + 1}, 핵심내용 열: ${coreContentCol + 1}, 진행사항 열: ${progressCol + 1}\n`);
        
        const requests = [];
        
        // 카메라 3개 행 업데이트 (행 22, 23, 24)
        for (let i = 0; i < 3; i++) {
            const rowIndex = 21 + i; // 0-based index
            const row = rows[rowIndex];
            const taskData = cameraData[i];
            
            console.log(`📝 행 ${rowIndex + 1} 업데이트: "${taskData.taskName}"`);
            
            // 업무명 셀 처리
            if (taskNameCol !== -1) {
                const taskCell = row.tableCells[taskNameCol];
                const currentTask = extractCellText(taskCell);
                
                if (currentTask.length === 0) {
                    // 빈 셀 - insertText 사용
                    const elements = taskCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: taskData.taskName
                            }
                        });
                    }
                } else {
                    // 기존 텍스트 있음 - replaceAllText 사용
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentTask, matchCase: false },
                            replaceText: taskData.taskName
                        }
                    });
                }
            }
            
            // 핵심내용 셀 처리
            if (coreContentCol !== -1) {
                const coreCell = row.tableCells[coreContentCol];
                const currentCore = extractCellText(coreCell);
                
                if (currentCore.length === 0) {
                    // 빈 셀 - insertText 사용
                    const elements = coreCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: taskData.coreContent
                            }
                        });
                    }
                } else {
                    // 기존 텍스트 있음 - replaceAllText 사용
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentCore, matchCase: false },
                            replaceText: taskData.coreContent
                        }
                    });
                }
            }
            
            // 진행사항 50%로 설정
            if (progressCol !== -1) {
                const progressCell = row.tableCells[progressCol];
                const currentProgress = extractCellText(progressCell);
                
                if (currentProgress.length === 0) {
                    // 빈 셀 - insertText 사용
                    const elements = progressCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: "50%"
                            }
                        });
                    }
                } else {
                    // 기존 텍스트 있음 - replaceAllText 사용
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentProgress, matchCase: false },
                            replaceText: "50%"
                        }
                    });
                }
            }
        }
        
        console.log(`\n🚀 ${requests.length}개 요청 실행 중...`);
        
        // 업데이트 실행
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: { requests: requests }
        });
        
        console.log('✅ 업데이트 완료!');
        console.log(`처리된 요청: ${response.data.replies?.length || 0}개`);
        
        console.log('\n📋 업데이트된 업무:');
        cameraData.forEach((task, index) => {
            console.log(`${index + 1}. ${task.taskName}`);
            console.log(`   └─ ${task.coreContent}`);
        });
        
        console.log('\n🎉 카메라 파트 업데이트 성공!');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
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
    updateEmptyCells().catch(console.error);
}

module.exports = { updateEmptyCells };