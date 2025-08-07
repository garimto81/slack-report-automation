#!/usr/bin/env node

/**
 * 카메라 파트 완전 정리
 */

require('dotenv').config();
const { google } = require('googleapis');

async function completeCameraFix() {
    console.log('🎯 카메라 파트 완전 정리');
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
        
        console.log('📋 행 23, 24 정리 작업');
        
        // 현재 "-" 로 채워진 셀들을 실제 데이터로 교체
        const requests = [
            // 행 23 업무명 (현재 "-")
            {
                replaceAllText: {
                    containsText: { 
                        text: "-", 
                        matchCase: false 
                    },
                    replaceText: '방송 품질 개선 작업'
                }
            }
        ];
        
        console.log('\n📝 1차 업데이트 (행 23 업무명):');
        console.log('  "-" → "방송 품질 개선 작업"');
        
        // 1차 업데이트 실행
        console.log('\n🚀 1차 업데이트 실행...');
        let response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: { requests: requests }
        });
        
        console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
        
        // 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 문서 다시 읽기
        let document = await docs.documents.get({ documentId });
        let content = document.data.body.content || [];
        let tableElement = content.find(element => element.table);
        let rows = tableElement.table.tableRows || [];
        
        // 2차 업데이트 준비 - 행 23의 핵심내용
        const row23 = rows[22]; // 0-based index
        const row23CoreContent = extractCellText(row23.tableCells[3]);
        
        if (row23CoreContent === '방송 품질 개선 작업') {
            // 핵심내용에 잘못 들어간 경우 수정
            console.log('\n📝 2차 업데이트 (행 23 핵심내용 수정):');
            const requests2 = [
                {
                    replaceAllText: {
                        containsText: { 
                            text: '방송 품질 개선 작업', 
                            matchCase: false 
                        },
                        replaceText: '화질 및 음질 최적화를 위한 설정 조정'
                    }
                }
            ];
            
            response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: requests2 }
            });
            
            console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
        }
        
        // 대기
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3차 업데이트 - 행 24 처리
        document = await docs.documents.get({ documentId });
        content = document.data.body.content || [];
        tableElement = content.find(element => element.table);
        rows = tableElement.table.tableRows || [];
        
        const row24 = rows[23]; // 0-based index
        const row24TaskName = extractCellText(row24.tableCells[2]);
        const row24CoreContent = extractCellText(row24.tableCells[3]);
        
        const requests3 = [];
        
        // 행 24 업무명이 비어있거나 "-"인 경우
        if (row24TaskName === '-' || row24TaskName === '화질 및 음질 최적화를 위한 설정 조정') {
            console.log('\n📝 3차 업데이트 (행 24 업무명):');
            console.log(`  "${row24TaskName}" → "신규 장비 도입 검토"`);
            
            requests3.push({
                replaceAllText: {
                    containsText: { 
                        text: row24TaskName, 
                        matchCase: false 
                    },
                    replaceText: '신규 장비 도입 검토'
                }
            });
        }
        
        // 행 24 핵심내용이 비어있거나 "-"인 경우
        if (row24CoreContent === '-' || row24CoreContent === '신규 장비 도입 검토') {
            console.log('\n📝 3차 업데이트 (행 24 핵심내용):');
            console.log(`  "${row24CoreContent}" → "촬영 효율성 향상을 위한 신규 장비 검토"`);
            
            requests3.push({
                replaceAllText: {
                    containsText: { 
                        text: row24CoreContent, 
                        matchCase: false 
                    },
                    replaceText: '촬영 효율성 향상을 위한 신규 장비 검토'
                }
            });
        }
        
        if (requests3.length > 0) {
            console.log('\n🚀 3차 업데이트 실행...');
            response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: requests3 }
            });
            
            console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
        }
        
        // 최종 확인
        console.log('\n⏳ 최종 확인 대기...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        document = await docs.documents.get({ documentId });
        content = document.data.body.content || [];
        tableElement = content.find(element => element.table);
        rows = tableElement.table.tableRows || [];
        
        console.log('\n📊 최종 카메라 파트 상태:');
        
        const cameraRows = [21, 22, 23]; // 0-based
        cameraRows.forEach((rowIdx, idx) => {
            const row = rows[rowIdx];
            const taskName = extractCellText(row.tableCells[2]);
            const coreContent = extractCellText(row.tableCells[3]);
            const progress = extractCellText(row.tableCells[4]);
            
            console.log(`\n  행 ${rowIdx + 1}:`);
            console.log(`    업무명: "${taskName}"`);
            console.log(`    핵심내용: "${coreContent}"`);
            console.log(`    진행사항: "${progress}"`);
        });
        
        console.log('\n🎉 카메라 파트 정리 완료!');
        
        return true;
        
    } catch (error) {
        console.error('❌ 정리 실패:', error.message);
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
    completeCameraFix().catch(console.error);
}

module.exports = { completeCameraFix };