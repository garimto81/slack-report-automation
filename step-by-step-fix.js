#!/usr/bin/env node

/**
 * 단계별 문서 정리 - 안전한 순서로 처리
 */

require('dotenv').config();
const { google } = require('googleapis');

async function stepByStepFix() {
    console.log('🔧 단계별 문서 정리 시작');
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
        
        // 1단계: 모든 문제가 있는 셀 완전 정리 (비우기)
        console.log('\\n🗑️ 1단계: 문제 셀 완전 정리');
        console.log('─'.repeat(50));
        
        let document = await docs.documents.get({ documentId });
        let content = document.data.body.content || [];
        
        let tableElement = content.find(element => element.table);
        if (!tableElement) {
            throw new Error('테이블을 찾을 수 없습니다.');
        }
        
        let rows = tableElement.table.tableRows || [];
        const cameraRows = [21, 22, 23]; // 0-based
        
        // 문제가 있는 모든 텍스트를 찾아서 비우기
        const cleanupRequests = [];
        
        cameraRows.forEach((rowIndex, idx) => {
            if (rowIndex < rows.length) {
                const row = rows[rowIndex];
                
                // 업무명 정리
                const taskCell = row.tableCells[2];
                const taskText = extractCellText(taskCell);
                if (taskText.length > 0) {
                    console.log(`  행 ${rowIndex + 1} 업무명 정리: "${taskText.substring(0, 50)}..."`);
                    cleanupRequests.push({
                        replaceAllText: {
                            containsText: { text: taskText, matchCase: false },
                            replaceText: ''
                        }
                    });
                }
                
                // 핵심내용 정리
                const coreCell = row.tableCells[3];
                const coreText = extractCellText(coreCell);
                if (coreText.length > 0) {
                    console.log(`  행 ${rowIndex + 1} 핵심내용 정리: "${coreText.substring(0, 50)}..."`);
                    cleanupRequests.push({
                        replaceAllText: {
                            containsText: { text: coreText, matchCase: false },
                            replaceText: ''
                        }
                    });
                }
                
                // 진행사항 정리
                const progressCell = row.tableCells[4];
                const progressText = extractCellText(progressCell);
                if (progressText.length > 0) {
                    console.log(`  행 ${rowIndex + 1} 진행사항 정리: "${progressText.substring(0, 50)}..."`);
                    cleanupRequests.push({
                        replaceAllText: {
                            containsText: { text: progressText, matchCase: false },
                            replaceText: ''
                        }
                    });
                }
            }
        });
        
        // 정리 실행
        if (cleanupRequests.length > 0) {
            console.log(`\\n🗑️ ${cleanupRequests.length}개 정리 작업 실행...`);
            await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: cleanupRequests }
            });
            
            console.log('✅ 정리 완료');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        }
        
        // 2단계: 새 데이터 입력
        console.log('\\n📝 2단계: 새 데이터 입력');
        console.log('─'.repeat(50));
        
        // 문서 다시 읽기
        document = await docs.documents.get({ documentId });
        content = document.data.body.content || [];
        tableElement = content.find(element => element.table);
        rows = tableElement.table.tableRows || [];
        
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
        
        const insertRequests = [];
        
        cameraRows.forEach((rowIndex, idx) => {
            if (idx < finalTasks.length && rowIndex < rows.length) {
                const task = finalTasks[idx];
                const row = rows[rowIndex];
                
                console.log(`\\n📝 행 ${rowIndex + 1}: "${task.taskName}"`);
                
                // 업무명 입력
                const taskCell = row.tableCells[2];
                const taskElements = taskCell.content[0]?.paragraph?.elements || [];
                if (taskElements.length > 0 && taskElements[0].startIndex !== undefined) {
                    console.log(`  업무명 입력: "${task.taskName}"`);
                    insertRequests.push({
                        insertText: {
                            location: { index: taskElements[0].startIndex },
                            text: task.taskName
                        }
                    });
                }
                
                // 핵심내용 입력
                const coreCell = row.tableCells[3];
                const coreElements = coreCell.content[0]?.paragraph?.elements || [];
                if (coreElements.length > 0 && coreElements[0].startIndex !== undefined) {
                    console.log(`  핵심내용 입력: "${task.coreContent}"`);
                    insertRequests.push({
                        insertText: {
                            location: { index: coreElements[0].startIndex },
                            text: task.coreContent
                        }
                    });
                }
                
                // 진행사항 입력
                const progressCell = row.tableCells[4];
                const progressElements = progressCell.content[0]?.paragraph?.elements || [];
                if (progressElements.length > 0 && progressElements[0].startIndex !== undefined) {
                    console.log(`  진행사항 입력: "50%"`);
                    insertRequests.push({
                        insertText: {
                            location: { index: progressElements[0].startIndex },
                            text: '50%'
                        }
                    });
                }
            }
        });
        
        // 입력 실행
        if (insertRequests.length > 0) {
            console.log(`\\n📝 ${insertRequests.length}개 입력 작업 실행...`);
            await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: insertRequests }
            });
            
            console.log('✅ 입력 완료');
        }
        
        // 3단계: 최종 확인
        console.log('\\n🔍 3단계: 최종 확인');
        console.log('─'.repeat(50));
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const finalDocument = await docs.documents.get({ documentId });
        const finalContent = finalDocument.data.body.content || [];
        const finalTableElement = finalContent.find(element => element.table);
        const finalRows = finalTableElement.table.tableRows || [];
        
        console.log('\\n✅ 최종 결과:');
        cameraRows.forEach((rowIndex, idx) => {
            if (rowIndex < finalRows.length) {
                const row = finalRows[rowIndex];
                const taskName = extractCellText(row.tableCells[2]);
                const coreContent = extractCellText(row.tableCells[3]);
                const progress = extractCellText(row.tableCells[4]);
                
                console.log(`  행 ${rowIndex + 1}:`);
                console.log(`    ✅ 업무명: "${taskName}"`);
                console.log(`    ✅ 핵심내용: "${coreContent}"`);
                console.log(`    ✅ 진행사항: "${progress}"`);
            }
        });
        
        console.log('\\n🎉 단계별 문서 정리 완료!');
        return true;
        
    } catch (error) {
        console.error('❌ 단계별 정리 실패:', error.message);
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
    stepByStepFix().catch(console.error);
}

module.exports = { stepByStepFix };