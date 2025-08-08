#!/usr/bin/env node

/**
 * 구글 문서에서 특정 텍스트 검색 및 매핑 값 찾기
 */

const { google } = require('googleapis');
const fs = require('fs');

async function searchDocumentContent() {
    console.log('🔍 구글 문서 내용 검색');
    console.log('=' .repeat(60));
    
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
        
        console.log(`📄 문서: "${document.data.title}"`);
        console.log(`🔍 검색 대상: "250807(작성용)"`);
        console.log('');
        
        // 3. 검색할 패턴들
        const searchPatterns = [
            '250807(작성용)',
            '250807',
            '작성용',
            '08/07',
            '8/7',
            '8월 7일'
        ];
        
        console.log('📋 검색 패턴:');
        searchPatterns.forEach(pattern => {
            console.log(`  - "${pattern}"`);
        });
        console.log('');
        
        const content = document.data.body.content || [];
        const foundItems = [];
        
        // 4. 모든 텍스트 요소 검색
        console.log('🔍 텍스트 검색 중...\n');
        
        content.forEach((element, elementIndex) => {
            // 단락 텍스트 검색
            if (element.paragraph) {
                const text = extractParagraphText(element.paragraph);
                
                searchPatterns.forEach(pattern => {
                    if (text.includes(pattern)) {
                        console.log(`✅ 발견! (요소 ${elementIndex + 1}, 단락)`);
                        console.log(`   패턴: "${pattern}"`);
                        console.log(`   텍스트: "${text}"`);
                        console.log('');
                        
                        foundItems.push({
                            type: 'paragraph',
                            elementIndex: elementIndex,
                            pattern: pattern,
                            text: text
                        });
                    }
                });
            }
            
            // 테이블 내용 검색
            if (element.table) {
                const tableRows = element.table.tableRows || [];
                console.log(`📊 테이블 검색 (요소 ${elementIndex + 1}): ${tableRows.length}행 × ${tableRows[0]?.tableCells?.length || 0}열\n`);
                
                tableRows.forEach((row, rowIndex) => {
                    const cells = row.tableCells || [];
                    const rowData = [];
                    let patternFoundInRow = false;
                    let foundPattern = '';
                    let foundCellIndex = -1;
                    
                    // 각 셀 확인
                    cells.forEach((cell, cellIndex) => {
                        const cellText = extractCellText(cell);
                        rowData.push(cellText);
                        
                        // 패턴 검색
                        searchPatterns.forEach(pattern => {
                            if (cellText.includes(pattern)) {
                                patternFoundInRow = true;
                                foundPattern = pattern;
                                foundCellIndex = cellIndex;
                            }
                        });
                    });
                    
                    // 패턴이 발견된 행 출력
                    if (patternFoundInRow) {
                        console.log(`✅ 테이블에서 발견! (행 ${rowIndex + 1})`);
                        console.log(`   패턴: "${foundPattern}"`);
                        console.log(`   발견된 열: ${foundCellIndex + 1}번째 열`);
                        console.log(`   전체 행 데이터:`);
                        
                        // 헤더 가져오기 (첫 번째 행)
                        if (rowIndex > 0 && tableRows[0]) {
                            const headers = [];
                            tableRows[0].tableCells.forEach(cell => {
                                headers.push(extractCellText(cell));
                            });
                            
                            // 헤더와 값 매핑
                            rowData.forEach((value, idx) => {
                                const header = headers[idx] || `열 ${idx + 1}`;
                                if (value) {
                                    console.log(`     ${header}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`);
                                }
                            });
                        } else {
                            // 헤더가 없는 경우
                            rowData.forEach((value, idx) => {
                                if (value) {
                                    console.log(`     열 ${idx + 1}: "${value.substring(0, 100)}${value.length > 100 ? '...' : ''}"`);
                                }
                            });
                        }
                        
                        console.log('');
                        
                        foundItems.push({
                            type: 'table',
                            elementIndex: elementIndex,
                            rowIndex: rowIndex,
                            cellIndex: foundCellIndex,
                            pattern: foundPattern,
                            rowData: rowData
                        });
                    }
                });
            }
        });
        
        // 5. 검색 결과 요약
        console.log('=' .repeat(60));
        console.log('📊 검색 결과 요약:');
        console.log('─'.repeat(40));
        
        if (foundItems.length > 0) {
            console.log(`✅ 총 ${foundItems.length}개 항목 발견\n`);
            
            foundItems.forEach((item, index) => {
                console.log(`${index + 1}. ${item.type === 'table' ? '테이블' : '단락'}`);
                console.log(`   위치: 요소 ${item.elementIndex + 1}`);
                if (item.type === 'table') {
                    console.log(`   행: ${item.rowIndex + 1}`);
                    console.log(`   열: ${item.cellIndex + 1}`);
                }
                console.log(`   패턴: "${item.pattern}"`);
                console.log('');
            });
            
            // 첫 번째 발견 항목의 상세 정보
            if (foundItems[0] && foundItems[0].type === 'table') {
                console.log('🎯 첫 번째 발견 항목 상세:');
                console.log('─'.repeat(40));
                const item = foundItems[0];
                console.log(`테이블 행 ${item.rowIndex + 1}의 전체 데이터:`);
                item.rowData.forEach((value, idx) => {
                    if (value) {
                        console.log(`  열 ${idx + 1}: "${value}"`);
                    }
                });
            }
        } else {
            console.log('❌ "250807(작성용)" 또는 관련 패턴을 찾을 수 없습니다.');
            console.log('\n💡 문서에 있는 날짜 형식 예시를 찾아보겠습니다...\n');
            
            // 날짜 패턴 찾기
            const datePatterns = [];
            content.forEach((element) => {
                if (element.table) {
                    const tableRows = element.table.tableRows || [];
                    tableRows.forEach((row) => {
                        row.tableCells.forEach((cell) => {
                            const cellText = extractCellText(cell);
                            // 숫자가 포함된 짧은 텍스트 찾기
                            if (cellText && cellText.length < 50 && /\d/.test(cellText)) {
                                if (cellText.includes('25') || cellText.includes('2025') || 
                                    cellText.includes('08') || cellText.includes('8월')) {
                                    datePatterns.push(cellText);
                                }
                            }
                        });
                    });
                }
            });
            
            if (datePatterns.length > 0) {
                console.log('📅 문서에서 발견된 날짜 관련 텍스트:');
                const uniquePatterns = [...new Set(datePatterns)];
                uniquePatterns.slice(0, 10).forEach(pattern => {
                    console.log(`  - "${pattern}"`);
                });
            }
        }
        
        console.log('\n✅ 검색 완료!');
        
    } catch (error) {
        console.error('\n❌ 검색 실패');
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
    searchDocumentContent().catch(console.error);
}

module.exports = { searchDocumentContent };