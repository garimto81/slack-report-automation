#!/usr/bin/env node

/**
 * 구글 문서 카메라 파트 정리 및 재업데이트
 */

require('dotenv').config();
const { google } = require('googleapis');

async function cleanupAndUpdate() {
    console.log('🧹 구글 문서 카메라 파트 정리 시작');
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
        
        // 카메라 행 찾기 (행 22, 23, 24)
        const cameraRows = [21, 22, 23]; // 0-based index
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        const coreContentCol = headers.indexOf('핵심 내용(방향성)');
        const progressCol = headers.indexOf('진행사항');
        const linkCol = headers.indexOf('문서') !== -1 ? headers.indexOf('문서') : headers.indexOf('문서 링크');
        
        console.log(`📍 컬럼 위치: 업무명(${taskNameCol}), 핵심내용(${coreContentCol}), 진행사항(${progressCol}), 문서(${linkCol})`);
        
        // 현재 상태 출력
        console.log('\n📊 현재 카메라 파트 상태:');
        cameraRows.forEach((rowIndex, idx) => {
            if (rowIndex < rows.length) {
                const row = rows[rowIndex];
                const taskName = taskNameCol !== -1 ? extractCellText(row.tableCells[taskNameCol]) : '';
                const coreContent = coreContentCol !== -1 ? extractCellText(row.tableCells[coreContentCol]) : '';
                const progress = progressCol !== -1 ? extractCellText(row.tableCells[progressCol]) : '';
                
                console.log(`  행 ${rowIndex + 1}:`);
                console.log(`    업무명: "${taskName}" (${taskName.length}자)`);
                console.log(`    핵심내용: "${coreContent}" (${coreContent.length}자)`);
                console.log(`    진행사항: "${progress}"`);
            }
        });
        
        // 정리 작업 수행
        console.log('\n🧹 카메라 파트 정리 작업 시작');
        
        const requests = [];
        
        // 새로운 업무 데이터
        const cleanTasks = [
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
        
        // 각 카메라 행 정리 및 새 데이터 입력
        cameraRows.forEach((rowIndex, idx) => {
            if (idx < cleanTasks.length && rowIndex < rows.length) {
                const task = cleanTasks[idx];
                const row = rows[rowIndex];
                
                console.log(`\n📝 행 ${rowIndex + 1} 정리: "${task.taskName}"`);
                
                // 업무명 정리
                if (taskNameCol !== -1) {
                    const currentTaskName = extractCellText(row.tableCells[taskNameCol]);
                    if (currentTaskName.length > 0) {
                        console.log(`  🧹 업무명 정리: "${currentTaskName.substring(0, 50)}..." → "${task.taskName}"`);
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentTaskName, matchCase: false },
                                replaceText: task.taskName
                            }
                        });
                    } else {
                        console.log(`  📝 업무명 입력: "${task.taskName}"`);
                        const elements = row.tableCells[taskNameCol].content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: task.taskName
                                }
                            });
                        }
                    }
                }
                
                // 핵심내용 처리
                if (coreContentCol !== -1) {
                    const currentCoreContent = extractCellText(row.tableCells[coreContentCol]);
                    if (currentCoreContent.length > 0) {
                        console.log(`  🧹 핵심내용 정리: "${currentCoreContent}" → "${task.coreContent}"`);
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentCoreContent, matchCase: false },
                                replaceText: task.coreContent
                            }
                        });
                    } else {
                        console.log(`  📝 핵심내용 입력: "${task.coreContent}"`);
                        const elements = row.tableCells[coreContentCol].content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: task.coreContent
                                }
                            });
                        }
                    }
                }
                
                // 진행사항 50%로 설정
                if (progressCol !== -1) {
                    const currentProgress = extractCellText(row.tableCells[progressCol]);
                    if (currentProgress.length > 0) {
                        console.log(`  📊 진행사항 설정: "${currentProgress}" → "50%"`);
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentProgress, matchCase: false },
                                replaceText: '50%'
                            }
                        });
                    } else {
                        console.log(`  📊 진행사항 입력: "50%"`);
                        const elements = row.tableCells[progressCol].content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: '50%'
                                }
                            });
                        }
                    }
                }
                
                // 문서 링크 정리 (있다면 삭제)
                if (linkCol !== -1) {
                    const currentLink = extractCellText(row.tableCells[linkCol]);
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
            }
        });
        
        // 업데이트 실행
        if (requests.length > 0) {
            console.log(`\n🚀 ${requests.length}개 업데이트 실행 중...`);
            
            const response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: requests }
            });
            
            console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
            
            // 업데이트 후 상태 확인
            console.log('\n🔍 업데이트 후 상태 확인...');
            const updatedDocument = await docs.documents.get({ documentId });
            const updatedContent = updatedDocument.data.body.content || [];
            
            let updatedTableElement = null;
            updatedContent.forEach((element) => {
                if (element.table && !updatedTableElement) {
                    updatedTableElement = element;
                }
            });
            
            const updatedRows = updatedTableElement.table.tableRows || [];
            
            console.log('\n✅ 업데이트 후 카메라 파트 상태:');
            cameraRows.forEach((rowIndex, idx) => {
                if (rowIndex < updatedRows.length) {
                    const row = updatedRows[rowIndex];
                    const taskName = taskNameCol !== -1 ? extractCellText(row.tableCells[taskNameCol]) : '';
                    const coreContent = coreContentCol !== -1 ? extractCellText(row.tableCells[coreContentCol]) : '';
                    const progress = progressCol !== -1 ? extractCellText(row.tableCells[progressCol]) : '';
                    
                    console.log(`  행 ${rowIndex + 1}:`);
                    console.log(`    업무명: "${taskName}"`);
                    console.log(`    핵심내용: "${coreContent}"`);
                    console.log(`    진행사항: "${progress}"`);
                }
            });
            
        } else {
            console.log('⚠️ 업데이트할 내용이 없습니다.');
        }
        
        console.log('\n🎉 카메라 파트 정리 완료!');
        return true;
        
    } catch (error) {
        console.error('❌ 정리 작업 실패:', error.message);
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
    cleanupAndUpdate().catch(console.error);
}

module.exports = { cleanupAndUpdate };