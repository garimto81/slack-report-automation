#!/usr/bin/env node

/**
 * 카메라 파트 수정 (깨진 데이터 복구 및 링크 삭제)
 */

require('dotenv').config();
const { google } = require('googleapis');

async function fixCameraUpdate() {
    console.log('🔧 카메라 파트 수정 작업');
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
        
        // 3. 업데이트할 데이터 정의
        const fixRequests = [];
        
        // 깨진 텍스트 복구를 위한 replaceAllText 요청들
        const textFixes = [
            // 행 22 수정
            { old: "ㅁㄴㅇㄻㄴㅇㄹㄹ", new: "카메라 렌즈 정기 점검" },
            { old: "전ㅁㄴㅇㄹ로 화질 개선", new: "전체 카메라 렌즈 청소 및 초점 재조정으로 화질 개선" },
            { old: "5ㄴㅇㄹ", new: "50%" },
            
            // 행 23 수정
            { old: "Pㄴㅁㅇㄹ", new: "PTZ 카메라 신규 설치" },
            { old: "WSㅁㄴㅇㄹ설치", new: "원격 제어 가능한 PTZ 카메라 2대 설치로 촬영 범위 확대" },
            { old: "5ㅁㄴㄹㅇ", new: "50%" },
            
            // 행 24 수정
            { old: "스ㄴㅁㅇㄹ", new: "스트리밍 설정 최적화" },
            { old: "Nㅁㄴㄹ 최적화", new: "비트레이트 조정 및 인코딩 설정으로 실시간 방송 품질 향상" },
            { old: "ㅁㄴㄹ", new: "50%" }
        ];
        
        // 텍스트 수정 요청 추가
        textFixes.forEach(fix => {
            fixRequests.push({
                replaceAllText: {
                    containsText: {
                        text: fix.old,
                        matchCase: true
                    },
                    replaceText: fix.new
                }
            });
        });
        
        console.log('📝 업데이트 내용:');
        console.log('─'.repeat(50));
        textFixes.forEach((fix, index) => {
            console.log(`${index + 1}. "${fix.old}" → "${fix.new}"`);
        });
        console.log('');
        
        // 4. 링크 삭제를 위한 추가 확인
        // 문서 열에서 "링크" 텍스트나 URL 패턴 찾아서 삭제
        const linkPatterns = [
            "링크",
            "http://",
            "https://",
            "www."
        ];
        
        linkPatterns.forEach(pattern => {
            fixRequests.push({
                replaceAllText: {
                    containsText: {
                        text: pattern,
                        matchCase: false
                    },
                    replaceText: ""
                }
            });
        });
        
        console.log(`🔗 링크 삭제 패턴: ${linkPatterns.length}개`);
        console.log('');
        
        // 5. 업데이트 실행
        console.log(`🚀 총 ${fixRequests.length}개 수정 요청 실행 중...`);
        
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: fixRequests
            }
        });
        
        console.log('✅ 수정 완료!');
        console.log(`처리된 요청: ${response.data.replies?.length || 0}개`);
        
        console.log('\n🎉 카메라 파트 수정 성공!');
        console.log('\n💡 결과 확인을 위해 문서를 다시 조회해보세요.');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// 실행
if (require.main === module) {
    fixCameraUpdate().catch(console.error);
}

module.exports = { fixCameraUpdate };