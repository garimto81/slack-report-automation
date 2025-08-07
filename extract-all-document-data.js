#!/usr/bin/env node

/**
 * 구글 문서의 모든 데이터 추출
 */

const { google } = require('googleapis');
const fs = require('fs');

async function extractAllDocumentData() {
    console.log('📄 구글 문서 전체 데이터 추출');
    console.log('=' .repeat(70));
    
    try {
        // 1. 인증 설정
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const client = await auth.getClient();
        console.log('✅ 인증 성공\n');
        
        // 2. 문서 가져오기
        const docs = google.docs({ version: 'v1', auth: client });
        const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        console.log('📌 문서 정보:');
        console.log(`제목: "${document.data.title}"`);
        console.log(`문서 ID: ${documentId}`);
        console.log('');
        
        // 3. 모든 내용 추출
        const content = document.data.body.content || [];
        console.log(`총 ${content.length}개 요소\n`);
        console.log('=' .repeat(70));
        console.log('📝 문서 전체 내용:');
        console.log('=' .repeat(70));
        
        let elementNumber = 0;
        
        content.forEach((element, index) => {
            elementNumber++;
            
            // 섹션 구분
            if (element.sectionBreak) {
                console.log(`\n[요소 ${elementNumber}] ━━━ 섹션 구분 ━━━`);
                const sectionType = element.sectionBreak.sectionStyle?.sectionType || 'CONTINUOUS';
                console.log(`섹션 타입: ${sectionType}`);
                console.log('');
            }
            
            // 페이지 구분
            else if (element.pageBreak) {
                console.log(`\n[요소 ${elementNumber}] ━━━ 페이지 구분 ━━━\n`);
            }
            
            // 단락
            else if (element.paragraph) {
                const text = extractParagraphText(element.paragraph);
                const style = element.paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
                
                if (text) {
                    console.log(`\n[요소 ${elementNumber}] 텍스트 (${style}):`);
                    console.log(`"${text}"`);
                } else {
                    console.log(`\n[요소 ${elementNumber}] (빈 단락)`);
                }
            }
            
            // 테이블
            else if (element.table) {
                const rows = element.table.tableRows || [];
                const cols = rows[0]?.tableCells?.length || 0;
                
                console.log(`\n[요소 ${elementNumber}] ━━━ 테이블 (${rows.length}행 × ${cols}열) ━━━`);
                console.log('');
                
                // 모든 행 출력
                rows.forEach((row, rowIndex) => {
                    console.log(`──── 행 ${rowIndex + 1} ────`);
                    
                    const cells = row.tableCells || [];
                    cells.forEach((cell, cellIndex) => {
                        const cellText = extractCellText(cell);
                        
                        // 헤더 이름 가져오기 (첫 번째 행이 헤더라고 가정)
                        let columnName = `열 ${cellIndex + 1}`;
                        if (rowIndex > 0 && rows[0] && rows[0].tableCells[cellIndex]) {
                            const headerText = extractCellText(rows[0].tableCells[cellIndex]);
                            if (headerText) {
                                columnName = headerText;
                            }
                        }
                        
                        if (cellText) {
                            // 첫 번째 행(헤더)인 경우
                            if (rowIndex === 0) {
                                console.log(`  [${columnName}]: "${cellText}"`);
                            } else {
                                console.log(`  ${columnName}: "${cellText}"`);
                            }
                        }
                    });
                    console.log('');
                });
            }
            
            // 기타 요소
            else {
                console.log(`\n[요소 ${elementNumber}] 기타 타입: ${Object.keys(element).join(', ')}`);
            }
        });
        
        // 4. 요약 통계
        console.log('\n');
        console.log('=' .repeat(70));
        console.log('📊 문서 통계:');
        console.log('=' .repeat(70));
        
        let paragraphCount = 0;
        let tableCount = 0;
        let totalTextLength = 0;
        let totalTableRows = 0;
        
        content.forEach(element => {
            if (element.paragraph) {
                paragraphCount++;
                const text = extractParagraphText(element.paragraph);
                totalTextLength += text.length;
            }
            if (element.table) {
                tableCount++;
                totalTableRows += element.table.tableRows?.length || 0;
            }
        });
        
        console.log(`- 총 요소: ${content.length}개`);
        console.log(`- 단락: ${paragraphCount}개`);
        console.log(`- 테이블: ${tableCount}개`);
        console.log(`- 총 테이블 행: ${totalTableRows}개`);
        console.log(`- 총 텍스트 길이: ${totalTextLength}자`);
        
        // 5. 데이터를 파일로 저장
        const outputData = {
            documentTitle: document.data.title,
            documentId: documentId,
            totalElements: content.length,
            extractedAt: new Date().toISOString(),
            content: []
        };
        
        content.forEach((element, index) => {
            if (element.paragraph) {
                outputData.content.push({
                    type: 'paragraph',
                    index: index + 1,
                    text: extractParagraphText(element.paragraph),
                    style: element.paragraph.paragraphStyle?.namedStyleType
                });
            } else if (element.table) {
                const tableData = {
                    type: 'table',
                    index: index + 1,
                    rows: []
                };
                
                element.table.tableRows?.forEach((row, rowIndex) => {
                    const rowData = [];
                    row.tableCells?.forEach(cell => {
                        rowData.push(extractCellText(cell));
                    });
                    tableData.rows.push(rowData);
                });
                
                outputData.content.push(tableData);
            } else if (element.sectionBreak) {
                outputData.content.push({
                    type: 'sectionBreak',
                    index: index + 1,
                    sectionType: element.sectionBreak.sectionStyle?.sectionType
                });
            }
        });
        
        // JSON 파일로 저장
        fs.writeFileSync('document-full-data.json', JSON.stringify(outputData, null, 2));
        console.log('\n✅ 전체 데이터가 document-full-data.json 파일에 저장되었습니다.');
        
        console.log('\n✅ 추출 완료!');
        
    } catch (error) {
        console.error('\n❌ 추출 실패');
        console.error('오류:', error.message);
    }
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

/**
 * 단락에서 텍스트 추출
 */
function extractParagraphText(paragraph) {
    let text = '';
    const elements = paragraph.elements || [];
    
    elements.forEach(elem => {
        if (elem.textRun && elem.textRun.content) {
            text += elem.textRun.content;
        }
    });
    
    return text.trim();
}

// 메인 실행
if (require.main === module) {
    extractAllDocumentData().catch(console.error);
}

module.exports = { extractAllDocumentData };