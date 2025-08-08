#!/usr/bin/env node

/**
 * 최종 문서 정리 - 완전히 새로 시작
 */

require('dotenv').config();
const { google } = require('googleapis');

async function finalFixDocument() {
    console.log('🔧 최종 문서 정리 시작');
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
        
        console.log(`📋 문서 ID: ${documentId}`);
        
        // 문서 현재 상태 읽기
        const document = await docs.documents.get({ documentId });
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
        
        console.log('📋 헤더:', headers);
        
        // 카메라 행 찾기 (행 22, 23, 24 - 0-based index로 21, 22, 23)
        const cameraStartRow = 21; // 0-based index
        const cameraRows = [21, 22, 23];
        
        // 정확한 컬럼 인덱스
        const taskNameColIndex = 2; // "진행 중인 업무 명칭" (0-based)
        const coreContentColIndex = 3; // "핵심 내용(방향성)" (0-based)  
        const progressColIndex = 4; // "진행사항" (0-based)
        const documentColIndex = 6; // "문서" (0-based)
        
        console.log(`📍 컬럼 인덱스: 업무명(${taskNameColIndex}), 핵심내용(${coreContentColIndex}), 진행사항(${progressColIndex}), 문서(${documentColIndex})`);
        
        // 현재 상태 상세 출력
        console.log('\\n📊 현재 카메라 파트 상세 상태:');
        cameraRows.forEach((rowIndex, idx) => {
            if (rowIndex < rows.length) {
                const row = rows[rowIndex];
                console.log(`\\n행 ${rowIndex + 1}:`);
                
                // 각 셀의 내용 출력
                row.tableCells.forEach((cell, cellIndex) => {
                    const cellText = extractCellText(cell);
                    console.log(`  [${cellIndex}] ${headers[cellIndex]}: "${cellText}" (${cellText.length}자)`);
                });
            }
        });
        
        // 완전 정리 요청 배치
        const requests = [];
        
        // 새로운 정확한 업무 데이터
        const finalTasks = [
            {
                taskName: '카메라 장비 점검 및 관리',
                coreContent: '촬영장비 상태 점검 및 유지보수 작업'
            },
            {
                taskName: '방송 품질 개선 작업', 
                coreContent: '화질 및 음질 최적화를 위한 설정 조정'
            },
            {
                taskName: '신규 장비 도입 검토',
                coreContent: '촬영 효율성 향상을 위한 신규 장비 검토'
            }
        ];
        
        console.log('\\n🧹 완전 정리 작업 시작');
        
        // 각 카메라 행에 대해 모든 필드 완전 정리
        cameraRows.forEach((rowIndex, idx) => {
            if (idx < finalTasks.length && rowIndex < rows.length) {
                const task = finalTasks[idx];
                const row = rows[rowIndex];
                
                console.log(`\\n📝 행 ${rowIndex + 1} 완전 정리: "${task.taskName}"`);
                
                // 1. 업무명 정리
                const taskCell = row.tableCells[taskNameColIndex];
                const currentTaskName = extractCellText(taskCell);
                console.log(`  업무명 현재: "${currentTaskName}"`);
                
                if (currentTaskName.length > 0) {
                    console.log(`  → 업무명 교체: "${task.taskName}"`);
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentTaskName, matchCase: false },
                            replaceText: task.taskName
                        }
                    });
                } else {
                    console.log(`  → 업무명 신규입력: "${task.taskName}"`);
                    const elements = taskCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: task.taskName
                            }
                        });
                    }
                }
                
                // 2. 핵심내용 정리
                const coreCell = row.tableCells[coreContentColIndex];
                const currentCoreContent = extractCellText(coreCell);
                console.log(`  핵심내용 현재: "${currentCoreContent}"`);
                
                if (currentCoreContent.length > 0) {
                    console.log(`  → 핵심내용 교체: "${task.coreContent}"`);
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentCoreContent, matchCase: false },
                            replaceText: task.coreContent
                        }
                    });
                } else {
                    console.log(`  → 핵심내용 신규입력: "${task.coreContent}"`);
                    const elements = coreCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: task.coreContent
                            }
                        });
                    }
                }
                
                // 3. 진행사항 정리 (50%로 통일)
                const progressCell = row.tableCells[progressColIndex];
                const currentProgress = extractCellText(progressCell);
                console.log(`  진행사항 현재: "${currentProgress}"`);
                
                if (currentProgress.length > 0) {
                    console.log(`  → 진행사항 50%로 교체`);
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentProgress, matchCase: false },
                            replaceText: '50%'
                        }
                    });
                } else {
                    console.log(`  → 진행사항 50% 신규입력`);
                    const elements = progressCell.content[0]?.paragraph?.elements || [];
                    if (elements.length > 0) {
                        requests.push({
                            insertText: {
                                location: { index: elements[0].startIndex },
                                text: '50%'
                            }
                        });
                    }
                }
                
                // 4. 문서 링크 정리 (삭제)
                const documentCell = row.tableCells[documentColIndex];
                const currentDocument = extractCellText(documentCell);
                if (currentDocument.length > 0) {
                    console.log(`  → 문서 링크 삭제: "${currentDocument}"`);
                    requests.push({
                        replaceAllText: {
                            containsText: { text: currentDocument, matchCase: false },
                            replaceText: ''
                        }
                    });
                } else {
                    console.log(`  → 문서 링크: 이미 비어있음`);
                }
            }
        });
        
        // 배치 업데이트 실행
        if (requests.length > 0) {
            console.log(`\\n🚀 ${requests.length}개 최종 정리 업데이트 실행...`);
            
            const response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: requests }
            });
            
            console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
            
            // 최종 결과 확인
            console.log('\\n🔍 최종 결과 확인 (3초 대기)...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const finalDocument = await docs.documents.get({ documentId });
            const finalContent = finalDocument.data.body.content || [];
            
            let finalTableElement = null;
            finalContent.forEach((element) => {
                if (element.table && !finalTableElement) {
                    finalTableElement = element;
                }
            });
            
            const finalRows = finalTableElement.table.tableRows || [];
            
            console.log('\\n✅ 최종 카메라 파트 결과:');
            cameraRows.forEach((rowIndex, idx) => {
                if (rowIndex < finalRows.length) {
                    const row = finalRows[rowIndex];
                    const taskName = extractCellText(row.tableCells[taskNameColIndex]);
                    const coreContent = extractCellText(row.tableCells[coreContentColIndex]);
                    const progress = extractCellText(row.tableCells[progressColIndex]);
                    const document = extractCellText(row.tableCells[documentColIndex]);
                    
                    console.log(`  행 ${rowIndex + 1}:`);
                    console.log(`    업무명: "${taskName}"`);
                    console.log(`    핵심내용: "${coreContent}"`);
                    console.log(`    진행사항: "${progress}"`);
                    console.log(`    문서: "${document}"`);
                }
            });
            
        } else {
            console.log('⚠️ 업데이트할 내용이 없습니다.');
        }
        
        console.log('\\n🎉 최종 문서 정리 완료!');
        return true;
        
    } catch (error) {
        console.error('❌ 최종 정리 실패:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
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
    finalFixDocument().catch(console.error);
}

module.exports = { finalFixDocument };