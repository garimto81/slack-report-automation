#!/usr/bin/env node

/**
 * 구글 문서의 모든 페이지/섹션 분석
 */

const { google } = require('googleapis');
const fs = require('fs');

async function analyzeAllPages() {
    console.log('📚 구글 문서 전체 페이지 분석');
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
        
        console.log('📄 문서: "' + document.data.title + '"');
        console.log('');
        
        // 3. 전체 문서 내용 분석
        const content = document.data.body.content || [];
        console.log(`📊 전체 문서 구조:`);
        console.log(`총 요소 개수: ${content.length}개`);
        console.log('');
        
        // 4. 페이지/섹션 구분 찾기
        let pageCount = 1; // 첫 페이지
        let currentPage = 1;
        const pages = [];
        let currentPageElements = [];
        
        console.log('🔍 페이지/섹션 구분 분석:');
        console.log('─'.repeat(50));
        
        content.forEach((element, index) => {
            // 페이지 구분자 확인
            if (element.pageBreak) {
                console.log(`\n📄 페이지 구분 발견! (요소 ${index + 1})`);
                pages.push({
                    pageNumber: currentPage,
                    elements: [...currentPageElements],
                    type: 'pageBreak'
                });
                currentPageElements = [];
                currentPage++;
                pageCount++;
            }
            // 섹션 구분자 확인
            else if (element.sectionBreak) {
                const sectionType = element.sectionBreak.sectionStyle?.sectionType || 'UNKNOWN';
                console.log(`\n📑 섹션 구분 발견! (요소 ${index + 1})`);
                console.log(`  섹션 타입: ${sectionType}`);
                
                // NEXT_PAGE 타입이면 새 페이지
                if (sectionType === 'NEXT_PAGE') {
                    pages.push({
                        pageNumber: currentPage,
                        elements: [...currentPageElements],
                        type: 'sectionBreak_nextPage'
                    });
                    currentPageElements = [];
                    currentPage++;
                    pageCount++;
                } else if (sectionType === 'CONTINUOUS') {
                    // CONTINUOUS는 같은 페이지 내 섹션
                    currentPageElements.push(element);
                } else {
                    // 기타 섹션 타입도 새 페이지로 처리
                    pages.push({
                        pageNumber: currentPage,
                        elements: [...currentPageElements],
                        type: `sectionBreak_${sectionType}`
                    });
                    currentPageElements = [];
                    currentPage++;
                    pageCount++;
                }
            }
            // 일반 요소
            else {
                currentPageElements.push(element);
            }
        });
        
        // 마지막 페이지 추가
        if (currentPageElements.length > 0) {
            pages.push({
                pageNumber: currentPage,
                elements: currentPageElements,
                type: 'last'
            });
        }
        
        console.log(`\n📚 총 페이지 수: ${pages.length}개`);
        console.log('');
        
        // 5. 각 페이지 상세 분석
        console.log('📖 각 페이지 상세 분석:');
        console.log('=' .repeat(70));
        
        pages.forEach((page, pageIndex) => {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📄 페이지 ${pageIndex + 1}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`요소 개수: ${page.elements.length}개`);
            console.log(`구분 타입: ${page.type}`);
            console.log('');
            
            // 페이지 내용 요약
            let pageText = '';
            let tableCount = 0;
            let paragraphCount = 0;
            let hasDatePattern = false;
            let hasCameraText = false;
            
            page.elements.forEach((element, elemIndex) => {
                if (element.paragraph) {
                    paragraphCount++;
                    const text = extractParagraphText(element.paragraph);
                    if (text) {
                        pageText += text + ' ';
                        
                        // 날짜 패턴 검색
                        if (text.match(/25\d{4}/) || text.includes('(작성용)')) {
                            hasDatePattern = true;
                            console.log(`  🔍 날짜 패턴 발견: "${text}"`);
                        }
                        
                        // 카메라 텍스트 검색
                        if (text.includes('카메라')) {
                            hasCameraText = true;
                        }
                    }
                }
                
                if (element.table) {
                    tableCount++;
                    const rows = element.table.tableRows || [];
                    const cols = rows[0]?.tableCells?.length || 0;
                    console.log(`  📊 테이블: ${rows.length}행 × ${cols}열`);
                    
                    // 테이블에서 카메라 찾기
                    rows.forEach((row, rowIndex) => {
                        row.tableCells.forEach(cell => {
                            const cellText = extractCellText(cell);
                            if (cellText.includes('카메라')) {
                                hasCameraText = true;
                                console.log(`    ✅ 카메라 발견 (행 ${rowIndex + 1})`);
                            }
                            if (cellText.match(/25\d{4}/) || cellText.includes('(작성용)')) {
                                hasDatePattern = true;
                                console.log(`    🔍 날짜/작성용 패턴: "${cellText}"`);
                            }
                        });
                    });
                }
            });
            
            // 페이지 요약 정보
            console.log(`\n📝 페이지 요약:`);
            console.log(`  - 단락: ${paragraphCount}개`);
            console.log(`  - 테이블: ${tableCount}개`);
            console.log(`  - 카메라 관련: ${hasCameraText ? '✅ 있음' : '❌ 없음'}`);
            console.log(`  - 날짜 패턴: ${hasDatePattern ? '✅ 있음' : '❌ 없음'}`);
            
            // 페이지 시작 텍스트
            const previewText = pageText.substring(0, 100);
            if (previewText) {
                console.log(`  - 시작 텍스트: "${previewText}${pageText.length > 100 ? '...' : ''}"`);
            }
            
            // 페이지 제목 찾기 (첫 번째 헤딩)
            const firstHeading = page.elements.find(el => 
                el.paragraph?.paragraphStyle?.namedStyleType?.includes('HEADING')
            );
            if (firstHeading) {
                const headingText = extractParagraphText(firstHeading.paragraph);
                console.log(`  - 페이지 제목: "${headingText}"`);
            }
        });
        
        // 6. 오늘 날짜 패턴 검색
        console.log('\n');
        console.log('=' .repeat(70));
        console.log('🔍 날짜 패턴 검색 결과:');
        console.log('─'.repeat(50));
        
        const today = new Date();
        const todayPattern = `${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
        console.log(`오늘 날짜 패턴: ${todayPattern}`);
        
        // 모든 페이지에서 날짜 패턴 검색
        const datePatterns = [];
        pages.forEach((page, pageIndex) => {
            page.elements.forEach(element => {
                if (element.paragraph) {
                    const text = extractParagraphText(element.paragraph);
                    // YYMMDD 패턴 찾기
                    const matches = text.match(/\b(25\d{4})\b/g);
                    if (matches) {
                        matches.forEach(match => {
                            datePatterns.push({
                                pattern: match,
                                pageNumber: pageIndex + 1,
                                text: text
                            });
                        });
                    }
                }
                
                if (element.table) {
                    const rows = element.table.tableRows || [];
                    rows.forEach((row, rowIndex) => {
                        row.tableCells.forEach(cell => {
                            const cellText = extractCellText(cell);
                            const matches = cellText.match(/\b(25\d{4})\b/g);
                            if (matches) {
                                matches.forEach(match => {
                                    datePatterns.push({
                                        pattern: match,
                                        pageNumber: pageIndex + 1,
                                        text: cellText,
                                        isTable: true,
                                        rowIndex: rowIndex + 1
                                    });
                                });
                            }
                        });
                    });
                }
            });
        });
        
        if (datePatterns.length > 0) {
            console.log(`\n발견된 YYMMDD 형식 패턴:`);
            datePatterns.forEach(item => {
                console.log(`  - "${item.pattern}" (페이지 ${item.pageNumber}${item.isTable ? `, 테이블 행 ${item.rowIndex}` : ''})`);
                console.log(`    텍스트: "${item.text.substring(0, 50)}..."`);
            });
        } else {
            console.log('YYMMDD 형식의 날짜 패턴을 찾을 수 없습니다.');
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
    analyzeAllPages().catch(console.error);
}

module.exports = { analyzeAllPages };