#!/usr/bin/env node

/**
 * 카메라 파트 문서 링크 확인
 */

require('dotenv').config();
const { google } = require('googleapis');

async function checkCameraLinks() {
    console.log('🔍 카메라 파트 문서 링크 확인');
    console.log('=' .repeat(60));
    
    try {
        // 1. Google 인증
        const auth = new google.auth.GoogleAuth({
            keyFile: 'service-account-key-fixed.json',
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const client = await auth.getClient();
        const docs = google.docs({ version: 'v1', auth: client });
        const documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        console.log('✅ 인증 성공\n');
        
        // 2. 문서 가져오기
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        // 3. 테이블 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
            }
        });
        
        if (!tableElement) {
            console.error('❌ 테이블을 찾을 수 없습니다.');
            return;
        }
        
        const rows = tableElement.table.tableRows || [];
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        
        // 문서 열 인덱스 찾기
        const docCol = headers.indexOf('문서');
        console.log(`📋 문서 열: ${docCol + 1}번째 열\n`);
        
        // 4. 카메라 행들 확인 (행 22, 23, 24)
        const cameraRowNumbers = [21, 22, 23]; // 0-based index
        
        console.log('📊 카메라 파트 문서 링크 상태:');
        console.log('─'.repeat(50));
        
        cameraRowNumbers.forEach((rowIndex, idx) => {
            if (rowIndex < rows.length) {
                const row = rows[rowIndex];
                const docCellText = docCol !== -1 ? extractCellText(row.tableCells[docCol]) : '';
                
                console.log(`행 ${rowIndex + 1} (카메라 우선순위 ${idx + 1}):`);
                console.log(`  문서 열 내용: "${docCellText}"`);
                console.log(`  상태: ${docCellText.length === 0 ? '✅ 빈 상태' : '❌ 내용 존재'}`);
                console.log('');
            }
        });
        
        // 5. 전체 테이블에서 "링크" 텍스트 검색
        console.log('🔗 전체 테이블 "링크" 텍스트 검색:');
        console.log('─'.repeat(50));
        
        let linkFound = false;
        rows.forEach((row, rowIndex) => {
            row.tableCells.forEach((cell, cellIndex) => {
                const cellText = extractCellText(cell);
                if (cellText.includes('링크') || cellText.includes('link') || cellText.includes('Link')) {
                    console.log(`행 ${rowIndex + 1}, 열 ${cellIndex + 1}: "${cellText}"`);
                    linkFound = true;
                }
            });
        });
        
        if (!linkFound) {
            console.log('✅ "링크" 텍스트를 찾을 수 없습니다.');
        }
        
        console.log('\n✅ 확인 완료!');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
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

// 실행
if (require.main === module) {
    checkCameraLinks().catch(console.error);
}

module.exports = { checkCameraLinks };