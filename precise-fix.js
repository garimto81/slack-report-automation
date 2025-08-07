#!/usr/bin/env node

/**
 * 정확한 위치 기반 수정
 */

require('dotenv').config();
const { google } = require('googleapis');

async function preciseFix() {
    console.log('🎯 정확한 위치 기반 수정 시작');
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
        
        console.log('📋 문제 셀 정리 작업');
        
        // 정확히 문제가 있는 텍스트만 교체
        const problemText = "카메촬영50%장비 상태 점검 및방송화질50% 및 음질 최적화를신규촬영50% 효율성 향상을 위한 신규 장비 검토 장비 도입 검토 위한 설정 조정 품질 개선 작업 유지보수 작업라 장비 점검 및 관리";
        
        console.log('🗑️ 문제 텍스트 제거:');
        console.log(`  "${problemText.substring(0, 50)}..."`);
        
        const requests = [
            {
                replaceAllText: {
                    containsText: { 
                        text: problemText, 
                        matchCase: false 
                    },
                    replaceText: '카메라 장비 점검 및 관리'
                }
            },
            // 행 22의 핵심내용 (4번째 셀) - 현재 "-"
            {
                replaceAllText: {
                    containsText: { 
                        text: "-", 
                        matchCase: false 
                    },
                    replaceText: '촬영장비 상태 점검 및 유지보수 작업'
                }
            }
        ];
        
        console.log('\n📝 수정 내용:');
        console.log('  행 22 업무명: "카메라 장비 점검 및 관리"');
        console.log('  행 22 핵심내용: "촬영장비 상태 점검 및 유지보수 작업"');
        
        // 배치 업데이트 실행
        console.log('\n🚀 업데이트 실행...');
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: { requests: requests }
        });
        
        console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
        
        // 3초 대기 후 결과 확인
        console.log('\n⏳ 3초 대기...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 결과 확인
        console.log('\n🔍 업데이트 결과 확인:');
        const document = await docs.documents.get({ documentId });
        const content = document.data.body.content || [];
        
        const tableElement = content.find(element => element.table);
        if (tableElement) {
            const rows = tableElement.table.tableRows || [];
            
            // 행 22 확인
            if (rows[21]) {
                const row = rows[21];
                const taskName = extractCellText(row.tableCells[2]);
                const coreContent = extractCellText(row.tableCells[3]);
                const progress = extractCellText(row.tableCells[4]);
                
                console.log('  행 22:');
                console.log(`    업무명: "${taskName}"`);
                console.log(`    핵심내용: "${coreContent}"`);
                console.log(`    진행사항: "${progress}"`);
                
                if (taskName === '카메라 장비 점검 및 관리') {
                    console.log('\n✅ 성공적으로 수정되었습니다!');
                } else {
                    console.log('\n⚠️ 수정이 완전하지 않습니다.');
                }
            }
        }
        
        console.log('\n💡 다음 단계:');
        console.log('1. 행 23, 24의 빈 셀은 수동으로 채워주세요');
        console.log('2. 또는 다른 문서를 생성하여 데이터를 이전하는 것을 고려하세요');
        
        return true;
        
    } catch (error) {
        console.error('❌ 수정 실패:', error.message);
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
    preciseFix().catch(console.error);
}

module.exports = { preciseFix };