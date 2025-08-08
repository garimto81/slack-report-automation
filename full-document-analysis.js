#!/usr/bin/env node

/**
 * 구글 문서 전체 구조 상세 분석
 */

const { google } = require('googleapis');
const fs = require('fs');

async function fullDocumentAnalysis() {
    console.log('📋 구글 문서 전체 구조 상세 분석');
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
        
        // 3. 기본 정보
        console.log('📌 1. 문서 기본 정보');
        console.log('─'.repeat(50));
        console.log(`제목: "${document.data.title}"`);
        console.log(`문서 ID: ${documentId}`);
        console.log(`URL: https://docs.google.com/document/d/${documentId}/edit`);
        console.log(`리비전 ID: ${document.data.revisionId?.substring(0, 30)}...`);
        console.log('');
        
        // 4. 문서 스타일 정보
        console.log('🎨 2. 문서 스타일 설정');
        console.log('─'.repeat(50));
        const docStyle = document.data.documentStyle;
        if (docStyle) {
            console.log(`페이지 크기: ${docStyle.pageSize?.width?.magnitude || 'N/A'} × ${docStyle.pageSize?.height?.magnitude || 'N/A'} ${docStyle.pageSize?.width?.unit || ''}`);
            
            if (docStyle.marginTop) {
                console.log(`여백: 상(${docStyle.marginTop.magnitude}), 하(${docStyle.marginBottom?.magnitude}), 좌(${docStyle.marginLeft?.magnitude}), 우(${docStyle.marginRight?.magnitude}) ${docStyle.marginTop.unit}`);
            }
            
            if (docStyle.defaultHeaderId || docStyle.defaultFooterId) {
                console.log(`머리글/바닥글: ${docStyle.defaultHeaderId ? '있음' : '없음'} / ${docStyle.defaultFooterId ? '있음' : '없음'}`);
            }
        }
        console.log('');
        
        // 5. 문서 내용 구조
        console.log('📄 3. 문서 내용 구조');
        console.log('─'.repeat(50));
        
        const content = document.data.body.content || [];
        console.log(`전체 요소 개수: ${content.length}개\n`);
        
        // 요소 타입별 카운트
        const elementTypes = {
            paragraph: 0,
            table: 0,
            sectionBreak: 0,
            tableOfContents: 0,
            pageBreak: 0,
            other: 0
        };
        
        content.forEach(element => {
            if (element.paragraph) elementTypes.paragraph++;
            else if (element.table) elementTypes.table++;
            else if (element.sectionBreak) elementTypes.sectionBreak++;
            else if (element.tableOfContents) elementTypes.tableOfContents++;
            else if (element.pageBreak) elementTypes.pageBreak++;
            else elementTypes.other++;
        });
        
        console.log('요소 타입별 분포:');
        Object.entries(elementTypes).forEach(([type, count]) => {
            if (count > 0) {
                console.log(`  - ${type}: ${count}개`);
            }
        });
        console.log('');
        
        // 6. 각 요소 상세 분석
        console.log('📝 4. 문서 요소 상세 (순서대로)');
        console.log('─'.repeat(50));
        
        content.forEach((element, index) => {
            console.log(`\n[요소 ${index + 1}]`);
            
            // 섹션 구분
            if (element.sectionBreak) {
                console.log('  타입: 섹션 구분');
                const sectionStyle = element.sectionBreak.sectionStyle;
                if (sectionStyle) {
                    console.log(`  섹션 타입: ${sectionStyle.sectionType || '기본'}`);
                }
            }
            
            // 단락
            else if (element.paragraph) {
                console.log('  타입: 단락');
                const text = extractParagraphText(element.paragraph);
                
                if (text) {
                    console.log(`  텍스트: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
                    console.log(`  길이: ${text.length}자`);
                } else {
                    console.log('  텍스트: (빈 단락)');
                }
                
                // 스타일 정보
                const style = element.paragraph.paragraphStyle;
                if (style) {
                    if (style.namedStyleType) {
                        console.log(`  스타일: ${style.namedStyleType}`);
                    }
                    if (style.alignment) {
                        console.log(`  정렬: ${style.alignment}`);
                    }
                }
                
                // 리스트 정보
                if (element.paragraph.bullet) {
                    console.log('  리스트 항목: 예');
                    if (element.paragraph.bullet.listId) {
                        console.log(`  리스트 ID: ${element.paragraph.bullet.listId}`);
                    }
                }
            }
            
            // 테이블
            else if (element.table) {
                console.log('  타입: 테이블');
                const rows = element.table.tableRows || [];
                const cols = rows[0]?.tableCells?.length || 0;
                console.log(`  크기: ${rows.length}행 × ${cols}열`);
                
                // 테이블 스타일
                const tableStyle = element.table.tableStyle;
                if (tableStyle && tableStyle.tableColumnProperties) {
                    console.log(`  열 너비 설정: ${tableStyle.tableColumnProperties.length}개 열`);
                }
                
                // 헤더 행 분석
                if (rows.length > 0) {
                    console.log('  헤더 행:');
                    const headers = [];
                    rows[0].tableCells.forEach((cell, cellIndex) => {
                        const text = extractCellText(cell);
                        headers.push(text);
                        console.log(`    열 ${cellIndex + 1}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
                    });
                    
                    // 특별한 행 찾기
                    console.log('  주요 데이터:');
                    let cameraRows = [];
                    let emptyRows = 0;
                    
                    rows.forEach((row, rowIndex) => {
                        if (rowIndex === 0) return; // 헤더 제외
                        
                        const cells = row.tableCells || [];
                        const firstCell = extractCellText(cells[0]);
                        
                        // 빈 행 카운트
                        const rowText = cells.map(cell => extractCellText(cell)).join('');
                        if (!rowText.trim()) {
                            emptyRows++;
                        }
                        
                        // 특정 키워드 찾기
                        if (firstCell.includes('카메라')) {
                            cameraRows.push({
                                rowIndex: rowIndex + 1,
                                content: firstCell
                            });
                        }
                    });
                    
                    console.log(`    빈 행: ${emptyRows}개`);
                    
                    if (cameraRows.length > 0) {
                        console.log(`    카메라 관련 행: ${cameraRows.length}개`);
                        cameraRows.forEach(row => {
                            console.log(`      - 행 ${row.rowIndex}: "${row.content}"`);
                        });
                    }
                    
                    // 파트별 분석
                    const parts = {};
                    rows.forEach((row, rowIndex) => {
                        if (rowIndex === 0) return;
                        const firstCell = extractCellText(row.tableCells[0]);
                        if (firstCell && !parts[firstCell]) {
                            parts[firstCell] = 0;
                        }
                        if (firstCell) {
                            parts[firstCell]++;
                        }
                    });
                    
                    const partKeys = Object.keys(parts).filter(key => key && key !== '파트');
                    if (partKeys.length > 0) {
                        console.log('  파트별 분포:');
                        partKeys.forEach(part => {
                            console.log(`    - ${part}: ${parts[part]}개 행`);
                        });
                    }
                }
            }
            
            // 페이지 구분
            else if (element.pageBreak) {
                console.log('  타입: 페이지 구분');
            }
            
            // 기타
            else {
                console.log('  타입: 기타');
                console.log(`  속성: ${Object.keys(element).join(', ')}`);
            }
        });
        
        // 7. 테이블 데이터 샘플
        console.log('\n📊 5. 테이블 데이터 샘플 (처음 5개 행)');
        console.log('─'.repeat(50));
        
        const tableElement = content.find(el => el.table);
        if (tableElement && tableElement.table) {
            const rows = tableElement.table.tableRows || [];
            const sampleRows = rows.slice(0, 6); // 헤더 포함 6개
            
            sampleRows.forEach((row, rowIndex) => {
                console.log(`\n행 ${rowIndex + 1}:`);
                const cells = row.tableCells || [];
                cells.forEach((cell, cellIndex) => {
                    const text = extractCellText(cell);
                    if (text) {
                        // 헤더 이름 가져오기
                        const headerText = rows[0] ? extractCellText(rows[0].tableCells[cellIndex]) : `열 ${cellIndex + 1}`;
                        console.log(`  ${headerText}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                    }
                });
            });
        }
        
        // 8. 리스트 정보
        if (document.data.lists && Object.keys(document.data.lists).length > 0) {
            console.log('\n📝 6. 리스트 정보');
            console.log('─'.repeat(50));
            
            Object.entries(document.data.lists).forEach(([listId, list]) => {
                console.log(`리스트 ID: ${listId}`);
                if (list.listProperties) {
                    const nestingLevels = list.listProperties.nestingLevels || [];
                    console.log(`  중첩 레벨: ${nestingLevels.length}개`);
                }
            });
        }
        
        // 9. 네임드 스타일
        console.log('\n🎨 7. 정의된 스타일');
        console.log('─'.repeat(50));
        
        if (document.data.namedStyles && document.data.namedStyles.styles) {
            const styles = document.data.namedStyles.styles;
            const styleNames = Object.keys(styles);
            console.log(`총 ${styleNames.length}개 스타일 정의됨`);
            styleNames.slice(0, 5).forEach(styleName => {
                console.log(`  - ${styleName}`);
            });
            if (styleNames.length > 5) {
                console.log(`  ... 외 ${styleNames.length - 5}개`);
            }
        }
        
        console.log('\n✅ 분석 완료!');
        
    } catch (error) {
        console.error('\n❌ 분석 실패');
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
    fullDocumentAnalysis().catch(console.error);
}

module.exports = { fullDocumentAnalysis };