#!/usr/bin/env node

/**
 * 단계별 절차적 테스트
 * 1. 문서 읽기 테스트
 * 2. 표에서 헤더에서 '카메라' 찾기
 * 3. 데이터 입력 값 추출
 */

require('dotenv').config();
const { google } = require('googleapis');

async function stepByStepTest() {
    console.log('🔬 단계별 절차적 테스트 시작');
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
        
        console.log(`📋 테스트 대상 문서 ID: ${documentId}\n`);
        
        // ============================================
        // 1단계: 문서 읽기 테스트
        // ============================================
        console.log('📖 1단계: 문서 읽기 테스트');
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        const document = await docs.documents.get({ documentId });
        const readTime = Date.now() - startTime;
        
        console.log(`✅ 문서 읽기 성공 (${readTime}ms)`);
        console.log(`📄 문서 제목: "${document.data.title}"`);
        console.log(`📋 리비전 ID: ${document.data.revisionId}`);
        console.log(`📊 문서 요소 수: ${document.data.body.content?.length || 0}개`);
        
        const content = document.data.body.content || [];
        let documentStats = {
            paragraphs: 0,
            tables: 0,
            sectionBreaks: 0,
            other: 0
        };
        
        content.forEach(element => {
            if (element.paragraph) documentStats.paragraphs++;
            else if (element.table) documentStats.tables++;
            else if (element.sectionBreak) documentStats.sectionBreaks++;
            else documentStats.other++;
        });
        
        console.log('📊 문서 구성:');
        console.log(`  - 단락: ${documentStats.paragraphs}개`);
        console.log(`  - 표: ${documentStats.tables}개`);
        console.log(`  - 섹션 구분: ${documentStats.sectionBreaks}개`);
        console.log(`  - 기타: ${documentStats.other}개`);
        
        if (documentStats.tables === 0) {
            console.log('❌ 표가 없습니다. 테스트 중단.');
            return;
        }
        
        console.log('\n✅ 1단계 완료: 문서 읽기 성공\n');
        
        // ============================================
        // 2단계: 표에서 헤더에서 '카메라' 찾기
        // ============================================
        console.log('🔍 2단계: 표에서 헤더 "카메라" 찾기');
        console.log('─'.repeat(50));
        
        // 첫 번째 표 찾기
        let tableElement = null;
        let tableIndex = -1;
        
        content.forEach((element, index) => {
            if (element.table && !tableElement) {
                tableElement = element;
                tableIndex = index;
            }
        });
        
        console.log(`📊 표 발견: 인덱스 ${tableIndex}`);
        
        const rows = tableElement.table.tableRows || [];
        const totalRows = rows.length;
        const totalCols = rows[0]?.tableCells?.length || 0;
        
        console.log(`📏 표 크기: ${totalRows}행 × ${totalCols}열`);
        
        // 헤더 행 분석 (첫 번째 행)
        console.log('\n📋 헤더 행 분석:');
        const headers = [];
        
        if (rows.length > 0) {
            const headerRow = rows[0];
            headerRow.tableCells.forEach((cell, colIndex) => {
                const cellText = extractCellText(cell);
                headers.push(cellText);
                console.log(`  열 ${colIndex + 1}: "${cellText}"`);
            });
        }
        
        // 각 행에서 첫 번째 열 검색 (파트 열)
        console.log('\n🔍 각 행의 파트 열 검색:');
        const cameraRows = [];
        
        rows.forEach((row, rowIndex) => {
            const firstCell = row.tableCells[0];
            const firstCellText = extractCellText(firstCell);
            
            if (rowIndex < 10 || firstCellText.includes('카메라') || rowIndex > 20) {
                console.log(`  행 ${rowIndex + 1}: "${firstCellText}"`);
            }
            
            if (firstCellText === '카메라') {
                cameraRows.push({
                    rowIndex: rowIndex,
                    row: row
                });
                console.log(`  🎯 카메라 발견! 행 ${rowIndex + 1}`);
            }
        });
        
        if (cameraRows.length === 0) {
            console.log('❌ "카메라" 파트를 찾을 수 없습니다.');
            console.log('\n🔍 전체 파트 목록:');
            
            rows.forEach((row, rowIndex) => {
                if (rowIndex > 0) { // 헤더 제외
                    const firstCellText = extractCellText(row.tableCells[0]);
                    if (firstCellText.trim()) {
                        console.log(`  행 ${rowIndex + 1}: "${firstCellText}"`);
                    }
                }
            });
            return;
        }
        
        console.log(`\n✅ 2단계 완료: 카메라 파트 ${cameraRows.length}개 발견\n`);
        
        // ============================================
        // 3단계: 데이터 입력 값 추출
        // ============================================
        console.log('📤 3단계: 데이터 입력 값 추출');
        console.log('─'.repeat(50));
        
        // 주요 컬럼 인덱스 찾기
        const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
        const coreContentCol = headers.indexOf('핵심 내용(방향성)');
        const progressCol = headers.indexOf('진행사항');
        const reviewCol = headers.indexOf('검토결과');
        const linkCol = headers.indexOf('문서 링크') !== -1 ? headers.indexOf('문서 링크') : headers.indexOf('문서');
        
        console.log('📋 주요 컬럼 위치:');
        console.log(`  - 진행 중인 업무 명칭: ${taskNameCol !== -1 ? (taskNameCol + 1) + '번째' : '찾을 수 없음'}`);
        console.log(`  - 핵심 내용(방향성): ${coreContentCol !== -1 ? (coreContentCol + 1) + '번째' : '찾을 수 없음'}`);
        console.log(`  - 진행사항: ${progressCol !== -1 ? (progressCol + 1) + '번째' : '찾을 수 없음'}`);
        console.log(`  - 검토결과: ${reviewCol !== -1 ? (reviewCol + 1) + '번째' : '찾을 수 없음'}`);
        console.log(`  - 문서 링크: ${linkCol !== -1 ? (linkCol + 1) + '번째' : '찾을 수 없음'}`);
        
        if (taskNameCol === -1 || coreContentCol === -1) {
            console.log('❌ 필수 컬럼을 찾을 수 없습니다.');
            return;
        }
        
        console.log('\n📊 카메라 파트 현재 데이터 추출:');
        
        // 카메라 시작 행부터 3개 행 분석
        const startRowIndex = cameraRows[0].rowIndex;
        const cameraData = [];
        
        for (let i = 0; i < 3; i++) {
            const rowIndex = startRowIndex + i;
            
            if (rowIndex < rows.length) {
                const row = rows[rowIndex];
                
                const partCell = extractCellText(row.tableCells[0]);
                const priorityCell = row.tableCells[1] ? extractCellText(row.tableCells[1]) : '';
                const taskNameCell = taskNameCol !== -1 ? extractCellText(row.tableCells[taskNameCol]) : '';
                const coreContentCell = coreContentCol !== -1 ? extractCellText(row.tableCells[coreContentCol]) : '';
                const progressCell = progressCol !== -1 ? extractCellText(row.tableCells[progressCol]) : '';
                const reviewCell = reviewCol !== -1 ? extractCellText(row.tableCells[reviewCol]) : '';
                const linkCell = linkCol !== -1 ? extractCellText(row.tableCells[linkCol]) : '';
                
                const rowData = {
                    rowNumber: rowIndex + 1,
                    part: partCell,
                    priority: priorityCell,
                    taskName: taskNameCell,
                    coreContent: coreContentCell,
                    progress: progressCell,
                    review: reviewCell,
                    link: linkCell
                };
                
                cameraData.push(rowData);
                
                console.log(`\n📋 행 ${rowIndex + 1} (카메라 우선순위 ${i + 1}):`);
                console.log(`  파트: "${partCell}"`);
                console.log(`  우선순위: "${priorityCell}"`);
                console.log(`  업무명: "${taskNameCell}" (길이: ${taskNameCell.length})`);
                console.log(`  핵심내용: "${coreContentCell}" (길이: ${coreContentCell.length})`);
                console.log(`  진행사항: "${progressCell}"`);
                console.log(`  검토결과: "${reviewCell}"`);
                console.log(`  문서 링크: "${linkCell}"`);
                
                // 셀 구조 분석 (첫 번째 행만)
                if (i === 0) {
                    console.log('\n🔬 첫 번째 행 셀 구조 분석:');
                    
                    if (taskNameCol !== -1) {
                        const taskCell = row.tableCells[taskNameCol];
                        const elements = taskCell.content[0]?.paragraph?.elements || [];
                        console.log(`    업무명 셀 elements: ${elements.length}개`);
                        
                        if (elements.length > 0) {
                            console.log(`      startIndex: ${elements[0].startIndex}`);
                            console.log(`      endIndex: ${elements[0].endIndex}`);
                            console.log(`      텍스트 런: ${elements[0].textRun ? 'O' : 'X'}`);
                        }
                    }
                    
                    if (coreContentCol !== -1) {
                        const coreCell = row.tableCells[coreContentCol];
                        const elements = coreCell.content[0]?.paragraph?.elements || [];
                        console.log(`    핵심내용 셀 elements: ${elements.length}개`);
                        
                        if (elements.length > 0) {
                            console.log(`      startIndex: ${elements[0].startIndex}`);
                            console.log(`      endIndex: ${elements[0].endIndex}`);
                            console.log(`      텍스트 런: ${elements[0].textRun ? 'O' : 'X'}`);
                        }
                    }
                }
            }
        }
        
        console.log(`\n✅ 3단계 완료: ${cameraData.length}개 행 데이터 추출 성공`);
        
        // ============================================
        // 보너스: 업데이트 가능성 분석
        // ============================================
        console.log('\n🎯 보너스: 업데이트 가능성 분석');
        console.log('─'.repeat(50));
        
        let updateStrategy = {
            insertTextCount: 0,
            replaceTextCount: 0,
            totalUpdates: 0
        };
        
        cameraData.forEach((data, index) => {
            console.log(`\n행 ${data.rowNumber} 업데이트 전략:`);
            
            // 업무명 전략
            if (data.taskName.length === 0) {
                console.log(`  업무명: insertText 사용 (빈 셀)`);
                updateStrategy.insertTextCount++;
            } else {
                console.log(`  업무명: replaceAllText 사용 (기존: "${data.taskName.substring(0, 20)}...")`);
                updateStrategy.replaceTextCount++;
            }
            updateStrategy.totalUpdates++;
            
            // 핵심내용 전략
            if (data.coreContent.length === 0) {
                console.log(`  핵심내용: insertText 사용 (빈 셀)`);
                updateStrategy.insertTextCount++;
            } else {
                console.log(`  핵심내용: replaceAllText 사용 (기존: "${data.coreContent.substring(0, 20)}...")`);
                updateStrategy.replaceTextCount++;
            }
            updateStrategy.totalUpdates++;
            
            // 진행사항 전략
            if (data.progress.length === 0) {
                console.log(`  진행사항: insertText 사용 (빈 셀)`);
                updateStrategy.insertTextCount++;
            } else {
                console.log(`  진행사항: replaceAllText 사용 (현재: "${data.progress}")`);
                updateStrategy.replaceTextCount++;
            }
            updateStrategy.totalUpdates++;
        });
        
        console.log('\n📊 전체 업데이트 전략 요약:');
        console.log(`  - 총 업데이트 수: ${updateStrategy.totalUpdates}개`);
        console.log(`  - insertText 사용: ${updateStrategy.insertTextCount}개`);
        console.log(`  - replaceAllText 사용: ${updateStrategy.replaceTextCount}개`);
        
        const insertRatio = ((updateStrategy.insertTextCount / updateStrategy.totalUpdates) * 100).toFixed(1);
        console.log(`  - 빈 셀 비율: ${insertRatio}%`);
        
        console.log('\n🎉 모든 절차적 테스트 완료!');
        console.log('\n💡 결론:');
        console.log('  ✅ 문서 읽기: 정상');
        console.log('  ✅ 카메라 파트 찾기: 정상');
        console.log('  ✅ 데이터 추출: 정상');
        console.log('  ✅ 업데이트 준비: 완료');
        
    } catch (error) {
        console.error('❌ 테스트 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
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
    stepByStepTest().catch(console.error);
}

module.exports = { stepByStepTest };