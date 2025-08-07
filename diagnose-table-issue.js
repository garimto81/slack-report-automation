#!/usr/bin/env node

/**
 * Google Docs 테이블 구조 상세 진단
 */

require('dotenv').config();
const { google } = require('googleapis');

async function diagnoseTableIssue() {
    console.log('🔬 Google Docs 테이블 구조 진단');
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
        
        // 문서 읽기
        const document = await docs.documents.get({ documentId });
        
        console.log(`📄 문서 ID: ${documentId}`);
        console.log(`📋 리비전: ${document.data.revisionId}`);
        
        // 테이블 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        let tableStartIndex = -1;
        let tableEndIndex = -1;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
                tableStartIndex = element.startIndex;
                tableEndIndex = element.endIndex;
            }
        });
        
        if (!tableElement) {
            throw new Error('테이블을 찾을 수 없습니다.');
        }
        
        console.log(`\n📊 테이블 정보:`);
        console.log(`  시작 인덱스: ${tableStartIndex}`);
        console.log(`  종료 인덱스: ${tableEndIndex}`);
        console.log(`  총 행 수: ${tableElement.table.rows}`);
        console.log(`  총 열 수: ${tableElement.table.columns}`);
        
        const rows = tableElement.table.tableRows || [];
        
        // 카메라 파트 행만 상세 분석
        console.log('\n🎯 카메라 파트 상세 분석 (행 22-24):');
        console.log('─'.repeat(60));
        
        const cameraRows = [21, 22, 23]; // 0-based
        
        cameraRows.forEach((rowIdx) => {
            if (rowIdx >= rows.length) return;
            
            const row = rows[rowIdx];
            console.log(`\n📋 행 ${rowIdx + 1} 상세 정보:`);
            console.log(`  행 시작 인덱스: ${row.startIndex}`);
            console.log(`  행 종료 인덱스: ${row.endIndex}`);
            console.log(`  셀 개수: ${row.tableCells?.length || 0}`);
            
            // 각 셀 상세 정보
            row.tableCells?.forEach((cell, cellIdx) => {
                console.log(`\n  셀 [${rowIdx + 1}, ${cellIdx + 1}]:`);
                console.log(`    시작 인덱스: ${cell.startIndex}`);
                console.log(`    종료 인덱스: ${cell.endIndex}`);
                
                // 셀 내용 구조
                const content = cell.content || [];
                console.log(`    컨텐츠 요소: ${content.length}개`);
                
                content.forEach((item, itemIdx) => {
                    if (item.paragraph) {
                        const para = item.paragraph;
                        console.log(`    단락 ${itemIdx + 1}:`);
                        console.log(`      시작: ${item.startIndex}`);
                        console.log(`      종료: ${item.endIndex}`);
                        
                        const elements = para.elements || [];
                        console.log(`      요소 수: ${elements.length}`);
                        
                        elements.forEach((elem, elemIdx) => {
                            console.log(`      요소 ${elemIdx + 1}:`);
                            console.log(`        시작: ${elem.startIndex}`);
                            console.log(`        종료: ${elem.endIndex}`);
                            
                            if (elem.textRun) {
                                const text = elem.textRun.content || '';
                                console.log(`        텍스트: "${text}" (${text.length}자)`);
                            }
                        });
                    }
                });
                
                // 전체 텍스트
                const fullText = extractCellText(cell);
                console.log(`    전체 텍스트: "${fullText}" (${fullText.length}자)`);
            });
        });
        
        // 문제 진단
        console.log('\n🔍 문제 진단:');
        console.log('─'.repeat(60));
        
        // 1. 인덱스 중복 확인
        const indexMap = new Map();
        cameraRows.forEach((rowIdx) => {
            if (rowIdx >= rows.length) return;
            
            const row = rows[rowIdx];
            row.tableCells?.forEach((cell, cellIdx) => {
                const key = `${cell.startIndex}-${cell.endIndex}`;
                if (indexMap.has(key)) {
                    console.log(`❌ 인덱스 중복 발견: 행 ${rowIdx + 1}, 셀 ${cellIdx + 1}`);
                } else {
                    indexMap.set(key, `행 ${rowIdx + 1}, 셀 ${cellIdx + 1}`);
                }
            });
        });
        
        // 2. 빈 요소 확인
        let emptyElements = 0;
        cameraRows.forEach((rowIdx) => {
            if (rowIdx >= rows.length) return;
            
            const row = rows[rowIdx];
            row.tableCells?.forEach((cell) => {
                const content = cell.content || [];
                content.forEach((item) => {
                    if (item.paragraph) {
                        const elements = item.paragraph.elements || [];
                        if (elements.length === 0) {
                            emptyElements++;
                        }
                    }
                });
            });
        });
        
        if (emptyElements > 0) {
            console.log(`⚠️ 빈 paragraph elements 발견: ${emptyElements}개`);
        }
        
        // 3. 텍스트 길이 이상 확인
        cameraRows.forEach((rowIdx) => {
            if (rowIdx >= rows.length) return;
            
            const row = rows[rowIdx];
            row.tableCells?.forEach((cell, cellIdx) => {
                const fullText = extractCellText(cell);
                if (fullText.length > 100) {
                    console.log(`⚠️ 비정상적으로 긴 텍스트: 행 ${rowIdx + 1}, 셀 ${cellIdx + 1} (${fullText.length}자)`);
                    console.log(`   내용: "${fullText.substring(0, 50)}..."`);
                }
            });
        });
        
        // 4. 해결 방안 제시
        console.log('\n💡 해결 방안:');
        console.log('─'.repeat(60));
        console.log('1. 현재 문서의 인덱스 구조가 복잡하게 꼬여있음');
        console.log('2. Google Docs API의 batchUpdate가 예상대로 작동하지 않음');
        console.log('3. 권장 해결책:');
        console.log('   a) 문서를 새로 만들어서 데이터 이전');
        console.log('   b) 또는 Google Sheets API 사용 고려');
        console.log('   c) 또는 수동으로 완전히 정리 후 읽기 전용 모드로 전환');
        
        return true;
        
    } catch (error) {
        console.error('❌ 진단 실패:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

// 셀에서 텍스트 추출
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
    diagnoseTableIssue().catch(console.error);
}

module.exports = { diagnoseTableIssue };