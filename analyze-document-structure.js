#!/usr/bin/env node

/**
 * 구글 문서 전체 구조 및 탭 분석
 */

const { google } = require('googleapis');
const fs = require('fs');

async function analyzeDocumentStructure() {
    console.log('📄 구글 문서 전체 구조 분석');
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
        
        // 2. 문서 전체 내용 가져오기
        const docs = google.docs({ version: 'v1', auth: client });
        const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        console.log(`📋 문서 ID: ${documentId}`);
        console.log(`🔗 문서 URL: https://docs.google.com/document/d/${documentId}/edit`);
        console.log('');
        
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        // 3. 기본 정보
        console.log('📌 문서 기본 정보:');
        console.log('─'.repeat(40));
        console.log(`제목: "${document.data.title}"`);
        console.log(`문서 ID: ${document.data.documentId}`);
        console.log(`리비전 ID: ${document.data.revisionId?.substring(0, 30)}...`);
        console.log('');
        
        // 4. 문서 구조 타입 확인
        console.log('🏗️ 문서 구조 타입:');
        console.log('─'.repeat(40));
        
        if (document.data.tabs) {
            console.log('✅ 탭이 있는 문서 (Multi-tab document)');
            console.log(`📑 총 탭 개수: ${document.data.tabs.length}개`);
            console.log('');
            
            // 모든 탭 정보 표시
            console.log('📑 탭 목록:');
            console.log('─'.repeat(40));
            
            document.data.tabs.forEach((tab, index) => {
                console.log(`\n탭 ${index + 1}:`);
                
                if (tab.tabProperties) {
                    console.log(`  제목: "${tab.tabProperties.title || '제목 없음'}"`);
                    console.log(`  탭 ID: ${tab.tabProperties.tabId}`);
                    
                    if (tab.tabProperties.index !== undefined) {
                        console.log(`  인덱스: ${tab.tabProperties.index}`);
                    }
                    
                    if (tab.tabProperties.nestingLevel !== undefined) {
                        console.log(`  중첩 레벨: ${tab.tabProperties.nestingLevel}`);
                    }
                }
                
                // 탭 내용 분석
                if (tab.documentTab && tab.documentTab.body) {
                    const content = tab.documentTab.body.content || [];
                    let tableCount = 0;
                    let paragraphCount = 0;
                    let totalTextLength = 0;
                    
                    content.forEach(element => {
                        if (element.table) tableCount++;
                        if (element.paragraph) {
                            paragraphCount++;
                            const text = extractParagraphText(element.paragraph);
                            totalTextLength += text.length;
                        }
                    });
                    
                    console.log(`  내용: ${paragraphCount}개 단락, ${tableCount}개 테이블, ${totalTextLength}자`);
                    
                    // 테이블이 있으면 헤더 정보도 표시
                    if (tableCount > 0) {
                        console.log(`  테이블 정보:`);
                        let tableIndex = 0;
                        content.forEach(element => {
                            if (element.table) {
                                tableIndex++;
                                const rows = element.table.tableRows || [];
                                const cols = rows[0]?.tableCells?.length || 0;
                                console.log(`    - 테이블 ${tableIndex}: ${rows.length}행 × ${cols}열`);
                                
                                // 첫 번째 행(헤더) 표시
                                if (rows.length > 0) {
                                    const headers = [];
                                    rows[0].tableCells.forEach(cell => {
                                        const text = extractCellText(cell);
                                        if (text) headers.push(text.substring(0, 15));
                                    });
                                    if (headers.length > 0) {
                                        console.log(`      헤더: [${headers.join(', ')}]`);
                                    }
                                }
                            }
                        });
                    }
                } else if (tab.documentTab) {
                    console.log(`  내용: 빈 탭`);
                }
            });
            
        } else if (document.data.body) {
            console.log('📄 단일 문서 (Single document without tabs)');
            console.log('');
            
            const content = document.data.body.content || [];
            console.log(`📊 문서 내용 통계:`);
            console.log('─'.repeat(40));
            
            let tableCount = 0;
            let paragraphCount = 0;
            let totalTextLength = 0;
            let listCount = 0;
            
            content.forEach(element => {
                if (element.table) tableCount++;
                if (element.paragraph) {
                    paragraphCount++;
                    const text = extractParagraphText(element.paragraph);
                    totalTextLength += text.length;
                    
                    // 리스트 항목 확인
                    if (element.paragraph.bullet) {
                        listCount++;
                    }
                }
            });
            
            console.log(`단락: ${paragraphCount}개`);
            console.log(`테이블: ${tableCount}개`);
            console.log(`리스트 항목: ${listCount}개`);
            console.log(`전체 텍스트: ${totalTextLength}자`);
            console.log('');
            
            // 테이블 상세 정보
            if (tableCount > 0) {
                console.log('📊 테이블 상세 정보:');
                console.log('─'.repeat(40));
                
                let tableIndex = 0;
                content.forEach((element, elemIndex) => {
                    if (element.table) {
                        tableIndex++;
                        const rows = element.table.tableRows || [];
                        const cols = rows[0]?.tableCells?.length || 0;
                        
                        console.log(`\n테이블 ${tableIndex}:`);
                        console.log(`  위치: 문서 요소 ${elemIndex + 1}`);
                        console.log(`  크기: ${rows.length}행 × ${cols}열`);
                        
                        // 헤더 행 분석
                        if (rows.length > 0) {
                            const headers = [];
                            let hasCamera = false;
                            
                            rows[0].tableCells.forEach(cell => {
                                const text = extractCellText(cell);
                                headers.push(text);
                                if (text.includes('카메라')) hasCamera = true;
                            });
                            
                            console.log(`  헤더: [${headers.map(h => h.substring(0, 20)).join(', ')}]`);
                            
                            if (hasCamera) {
                                console.log(`  ✅ 카메라 관련 테이블`);
                                
                                // 카메라가 포함된 행 카운트
                                let cameraRows = 0;
                                rows.forEach((row, rowIndex) => {
                                    const firstCell = extractCellText(row.tableCells[0]);
                                    if (firstCell.includes('카메라')) {
                                        cameraRows++;
                                    }
                                });
                                
                                if (cameraRows > 0) {
                                    console.log(`  카메라 데이터 행: ${cameraRows}개`);
                                }
                            }
                        }
                        
                        // 첫 5개 행의 첫 번째 셀 내용 표시
                        console.log(`  첫 ${Math.min(5, rows.length)}개 행의 첫 번째 열:`);
                        for (let i = 0; i < Math.min(5, rows.length); i++) {
                            const firstCell = extractCellText(rows[i].tableCells[0]);
                            console.log(`    ${i + 1}. ${firstCell.substring(0, 30)}`);
                        }
                    }
                });
            }
            
            // 문서 첫 부분 내용 샘플
            console.log('\n📝 문서 시작 부분 (첫 10개 요소):');
            console.log('─'.repeat(40));
            
            content.slice(0, 10).forEach((element, index) => {
                if (element.paragraph) {
                    const text = extractParagraphText(element.paragraph);
                    if (text) {
                        console.log(`${index + 1}. [텍스트] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                    }
                } else if (element.table) {
                    const rows = element.table.tableRows?.length || 0;
                    const cols = element.table.tableRows?.[0]?.tableCells?.length || 0;
                    console.log(`${index + 1}. [테이블] ${rows}행 × ${cols}열`);
                } else if (element.sectionBreak) {
                    console.log(`${index + 1}. [섹션 구분]`);
                }
            });
        } else {
            console.log('❌ 인식할 수 없는 문서 구조');
        }
        
        // 5. 추가 메타데이터
        console.log('\n🔧 추가 정보:');
        console.log('─'.repeat(40));
        const topLevelKeys = Object.keys(document.data);
        console.log(`최상위 속성: ${topLevelKeys.join(', ')}`);
        
        // namedStyles 확인
        if (document.data.namedStyles) {
            const styleCount = Object.keys(document.data.namedStyles.styles).length;
            console.log(`스타일 정의: ${styleCount}개`);
        }
        
        // lists 확인
        if (document.data.lists) {
            const listCount = Object.keys(document.data.lists).length;
            if (listCount > 0) {
                console.log(`리스트 정의: ${listCount}개`);
            }
        }
        
        console.log('\n✅ 분석 완료!');
        
    } catch (error) {
        console.error('\n❌ 분석 실패');
        console.error('오류:', error.message);
        
        if (error.code === 404) {
            console.error('\n문서를 찾을 수 없습니다. 문서 ID를 확인해주세요.');
        } else if (error.code === 403) {
            console.error('\n권한이 없습니다. 문서가 서비스 계정과 공유되어 있는지 확인해주세요.');
        }
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
    analyzeDocumentStructure().catch(console.error);
}

module.exports = { analyzeDocumentStructure };