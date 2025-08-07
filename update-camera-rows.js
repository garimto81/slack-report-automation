#!/usr/bin/env node

/**
 * 구글 문서에서 카메라 파트를 찾아 업데이트
 */

const { google } = require('googleapis');
// const { ensureMinimumTasks } = require('./minimum-tasks-algorithm');
const { processTopTasks } = require('./top-tasks-processor');
require('dotenv').config();

/**
 * 카메라 행 찾기 및 업데이트
 */
async function updateCameraRows() {
    console.log('🎯 카메라 파트 업데이트 시작');
    console.log('=' .repeat(60));
    
    try {
        // 1. Google 인증
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const client = await auth.getClient();
        const docs = google.docs({ version: 'v1', auth: client });
        const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        console.log('✅ 인증 성공');
        console.log(`📄 문서 ID: ${documentId}\n`);
        
        // 2. 문서 가져오기
        console.log('📊 문서 분석 중...');
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        // 3. 테이블 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        let tableIndex = -1;
        
        content.forEach((element, index) => {
            if (element.table && !tableElement) {
                tableElement = element;
                tableIndex = index;
            }
        });
        
        if (!tableElement) {
            console.error('❌ 테이블을 찾을 수 없습니다.');
            return;
        }
        
        console.log('✅ 테이블 발견');
        const rows = tableElement.table.tableRows || [];
        console.log(`  크기: ${rows.length}행 × ${rows[0]?.tableCells?.length || 0}열\n`);
        
        // 4. 카메라 행 찾기
        console.log('🔍 카메라 파트 찾기...');
        const cameraRows = [];
        let startIndex = -1;
        
        rows.forEach((row, rowIndex) => {
            const firstCell = extractCellText(row.tableCells[0]);
            
            if (firstCell === '카메라') {
                if (startIndex === -1) {
                    startIndex = rowIndex;
                }
                // 카메라부터 시작해서 연속된 3개 행 수집
                cameraRows.push({
                    rowIndex: rowIndex,
                    row: row
                });
            } else if (startIndex !== -1 && cameraRows.length < 3) {
                // 카메라 다음 행들 (우선순위 2, 3)
                const priorityCell = extractCellText(row.tableCells[1]);
                if (priorityCell === '2' || priorityCell === '3') {
                    cameraRows.push({
                        rowIndex: rowIndex,
                        row: row
                    });
                }
            }
        });
        
        if (cameraRows.length === 0) {
            console.error('❌ 카메라 파트를 찾을 수 없습니다.');
            return;
        }
        
        console.log(`✅ 카메라 파트 발견!`);
        console.log(`  위치: 행 ${cameraRows[0].rowIndex + 1}부터 ${cameraRows.length}개 행\n`);
        
        // 5. 업무 데이터 가져오기 (임시 데이터)
        console.log('📋 업무 데이터 준비 중...');
        
        // Slack 데이터 대신 임시 테스트 데이터 사용
        const mockTasks = [
            "카메라 렌즈 청소 및 정기 점검 작업",
            "신규 PTZ 카메라 2대 설치 및 설정",
            "라이브 스트리밍 서버 최적화 작업",
            "4K 영상 녹화 시스템 업그레이드",
            "보안 카메라 네트워크 설정 확인"
        ];
        
        const taskResult = {
            tasks: mockTasks,
            tasksCount: mockTasks.length,
            reportType: 'daily',
            success: true
        };
        
        if (!taskResult.tasks || taskResult.tasks.length === 0) {
            console.error('❌ 업무 데이터를 가져올 수 없습니다.');
            return;
        }
        
        const processResult = await processTopTasks(taskResult.tasks, taskResult.reportType);
        
        if (!processResult.success || processResult.tasks.length === 0) {
            console.error('❌ 업무 처리에 실패했습니다.');
            return;
        }
        
        console.log(`✅ 상위 3개 업무 준비 완료\n`);
        
        // 6. 업데이트 요청 생성
        console.log('📝 업데이트 요청 생성 중...');
        const requests = [];
        
        // 헤더에서 열 인덱스 찾기
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        const coreContentCol = headers.indexOf('핵심 내용(방향성)');
        
        if (taskNameCol === -1 || coreContentCol === -1) {
            console.error('❌ 필요한 열을 찾을 수 없습니다.');
            return;
        }
        
        console.log(`  업무명 열: ${taskNameCol + 1}번째`);
        console.log(`  핵심내용 열: ${coreContentCol + 1}번째\n`);
        
        // 진행사항과 문서 링크 열 인덱스도 찾기
        const progressCol = headers.indexOf('진행사항');
        const linkCol = headers.indexOf('문서 링크');
        
        console.log(`  진행사항 열: ${progressCol + 1}번째`);
        console.log(`  문서 링크 열: ${linkCol + 1}번째\n`);
        
        // 각 카메라 행 업데이트
        cameraRows.forEach((cameraRow, index) => {
            if (index < processResult.tasks.length) {
                const task = processResult.tasks[index];
                const row = cameraRow.row;
                
                console.log(`📝 행 ${cameraRow.rowIndex + 1} 업데이트:`);
                console.log(`  업무: ${task.taskName}`);
                console.log(`  내용: ${task.coreContent}`);
                console.log(`  진행률: 50%`);
                console.log(`  링크: (삭제)\n`);
                
                // 업무명 셀 업데이트
                if (row.tableCells[taskNameCol]) {
                    const taskNameCell = row.tableCells[taskNameCol];
                    const taskNameRange = getCellRange(taskNameCell);
                    
                    if (taskNameRange) {
                        // 기존 내용 삭제
                        if (taskNameRange.endIndex > taskNameRange.startIndex) {
                            requests.push({
                                deleteContentRange: {
                                    range: {
                                        startIndex: taskNameRange.startIndex,
                                        endIndex: taskNameRange.endIndex
                                    }
                                }
                            });
                        }
                        
                        // 새 내용 삽입
                        requests.push({
                            insertText: {
                                location: {
                                    index: taskNameRange.startIndex
                                },
                                text: task.taskName
                            }
                        });
                    }
                }
                
                // 핵심 내용 셀 업데이트
                if (row.tableCells[coreContentCol]) {
                    const coreContentCell = row.tableCells[coreContentCol];
                    const coreContentRange = getCellRange(coreContentCell);
                    
                    if (coreContentRange) {
                        // 기존 내용 삭제
                        if (coreContentRange.endIndex > coreContentRange.startIndex) {
                            requests.push({
                                deleteContentRange: {
                                    range: {
                                        startIndex: coreContentRange.startIndex,
                                        endIndex: coreContentRange.endIndex
                                    }
                                }
                            });
                        }
                        
                        // 새 내용 삽입
                        requests.push({
                            insertText: {
                                location: {
                                    index: coreContentRange.startIndex
                                },
                                text: task.coreContent
                            }
                        });
                    }
                }
                
                // 진행사항 셀 업데이트 (50%로 고정)
                if (progressCol !== -1 && row.tableCells[progressCol]) {
                    const progressCell = row.tableCells[progressCol];
                    const progressRange = getCellRange(progressCell);
                    
                    if (progressRange) {
                        // 기존 내용 삭제
                        if (progressRange.endIndex > progressRange.startIndex) {
                            requests.push({
                                deleteContentRange: {
                                    range: {
                                        startIndex: progressRange.startIndex,
                                        endIndex: progressRange.endIndex
                                    }
                                }
                            });
                        }
                        
                        // 50% 삽입
                        requests.push({
                            insertText: {
                                location: {
                                    index: progressRange.startIndex
                                },
                                text: "50%"
                            }
                        });
                    }
                }
                
                // 문서 링크 셀 비우기
                if (linkCol !== -1 && row.tableCells[linkCol]) {
                    const linkCell = row.tableCells[linkCol];
                    const linkRange = getCellRange(linkCell);
                    
                    if (linkRange && linkRange.endIndex > linkRange.startIndex) {
                        // 기존 링크 삭제
                        requests.push({
                            deleteContentRange: {
                                range: {
                                    startIndex: linkRange.startIndex,
                                    endIndex: linkRange.endIndex
                                }
                            }
                        });
                    }
                }
            }
        });
        
        // 7. 업데이트 실행
        if (requests.length > 0) {
            console.log(`🚀 ${requests.length}개 업데이트 요청 실행 중...`);
            
            const response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: {
                    requests: requests
                }
            });
            
            console.log('✅ 업데이트 완료!');
            console.log(`  처리된 요청: ${response.data.replies?.length || 0}개`);
        } else {
            console.log('⚠️ 업데이트할 내용이 없습니다.');
        }
        
        console.log('\n🎉 카메라 파트 업데이트 성공!');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

/**
 * 셀의 텍스트 범위 가져오기
 */
function getCellRange(cell) {
    if (!cell.content || cell.content.length === 0) {
        return null;
    }
    
    // 첫 번째 paragraph element 찾기
    const firstParagraph = cell.content[0];
    if (!firstParagraph || !firstParagraph.paragraph) {
        return null;
    }
    
    // paragraph의 elements에서 실제 텍스트 범위 찾기
    const elements = firstParagraph.paragraph.elements || [];
    if (elements.length === 0) {
        return null;
    }
    
    // 첫 번째와 마지막 element의 인덱스 가져오기
    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];
    
    if (firstElement.startIndex !== undefined && lastElement.endIndex !== undefined) {
        return {
            startIndex: firstElement.startIndex,
            endIndex: lastElement.endIndex
        };
    }
    
    return null;
}

/**
 * 셀에서 텍스트 추출
 */
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
    updateCameraRows().catch(console.error);
}

module.exports = { updateCameraRows };