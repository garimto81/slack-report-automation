#!/usr/bin/env node

/**
 * 실제 Slack 데이터로 카메라 파트 업데이트
 */

require('dotenv').config();
const { google } = require('googleapis');

async function updateCameraRealData() {
    console.log('🎯 실제 데이터로 카메라 파트 업데이트');
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
        
        // 2. 실제 Slack 데이터 (분석 결과에서 가져온 데이터)
        const realSlackData = {
            row22: {
                currentTask: '카메라 렌즈 정기 점검',
                currentCore: '전체 카메라 렌즈 청소 및 초점 재조정으로 화질 개선',
                newTask: '카메라 장비 구매 및 배송',
                newCore: 'ColorChecker, Light Meter, Tally System, TVLogic 촬영장비 구매 및 배송관리'
            },
            row23: {
                currentTask: 'PTZ 카메라 신규 설치',
                currentCore: '원격 제어 가능한 PTZ 카메라 2대 설치로 촬영 범위 확대',
                newTask: 'Tally System 스위처 연동 테스트',
                newCore: 'Tally System과 스위처 호환성 확인 및 작동 테스트 진행'
            },
            row24: {
                currentTask: '스트리밍 설정 최적화',
                currentCore: '비트레이트 조정 및 인코딩 설정으로 실시간 방송 품질 향상',
                newTask: 'TVLogic 보호 케이스 제작',
                newCore: 'TVLogic 장비 안전 운송을 위한 맞춤형 보호케이스 제작'
            }
        };
        
        // 3. replaceAllText 요청 생성
        const requests = [];
        
        // 행 22 업데이트
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row22.currentTask, matchCase: true },
                replaceText: realSlackData.row22.newTask
            }
        });
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row22.currentCore, matchCase: true },
                replaceText: realSlackData.row22.newCore
            }
        });
        
        // 행 23 업데이트
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row23.currentTask, matchCase: true },
                replaceText: realSlackData.row23.newTask
            }
        });
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row23.currentCore, matchCase: true },
                replaceText: realSlackData.row23.newCore
            }
        });
        
        // 행 24 업데이트
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row24.currentTask, matchCase: true },
                replaceText: realSlackData.row24.newTask
            }
        });
        requests.push({
            replaceAllText: {
                containsText: { text: realSlackData.row24.currentCore, matchCase: true },
                replaceText: realSlackData.row24.newCore
            }
        });
        
        console.log('🔄 실제 데이터 업데이트 내용:');
        console.log('─'.repeat(50));
        console.log('행 22 (카메라 우선순위 1):');
        console.log(`  업무: ${realSlackData.row22.currentTask}`);
        console.log(`    → ${realSlackData.row22.newTask}`);
        console.log(`  내용: ${realSlackData.row22.currentCore}`);
        console.log(`    → ${realSlackData.row22.newCore}`);
        console.log('');
        
        console.log('행 23 (카메라 우선순위 2):');
        console.log(`  업무: ${realSlackData.row23.currentTask}`);
        console.log(`    → ${realSlackData.row23.newTask}`);
        console.log(`  내용: ${realSlackData.row23.currentCore}`);
        console.log(`    → ${realSlackData.row23.newCore}`);
        console.log('');
        
        console.log('행 24 (카메라 우선순위 3):');
        console.log(`  업무: ${realSlackData.row24.currentTask}`);
        console.log(`    → ${realSlackData.row24.newTask}`);
        console.log(`  내용: ${realSlackData.row24.currentCore}`);
        console.log(`    → ${realSlackData.row24.newCore}`);
        console.log('');
        
        // 4. 업데이트 실행
        console.log(`🚀 ${requests.length}개 실제 데이터 업데이트 실행 중...`);
        
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: requests
            }
        });
        
        console.log('✅ 실제 데이터 업데이트 완료!');
        console.log(`처리된 요청: ${response.data.replies?.length || 0}개`);
        
        console.log('\n📋 업데이트된 실제 업무:');
        console.log('─'.repeat(50));
        console.log('1. 카메라 장비 구매 및 배송');
        console.log('   └─ ColorChecker, Light Meter, Tally System, TVLogic');
        console.log('2. Tally System 스위처 연동 테스트');
        console.log('   └─ 호환성 확인 및 작동 테스트');
        console.log('3. TVLogic 보호 케이스 제작');
        console.log('   └─ 맞춤형 보호케이스 제작');
        
        console.log('\n🎉 실제 Slack 데이터로 카메라 파트 업데이트 성공!');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// 실행
if (require.main === module) {
    updateCameraRealData().catch(console.error);
}

module.exports = { updateCameraRealData };