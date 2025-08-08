#!/usr/bin/env node

/**
 * 간단한 카메라 파트 업데이트 (replaceText 사용)
 */

require('dotenv').config();
const { google } = require('googleapis');

async function simpleUpdateCamera() {
    console.log('🎯 카메라 파트 업데이트 (간단 버전)');
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
        
        // 3. 현재 카메라 파트 데이터 찾기
        const currentData = {
            row22: {
                taskName: '프라하 장비 운송 최적화',
                coreContent: '프라하 - 키프로스 장비 운송 최적화',
                progress: '보고완료'
            },
            row23: {
                taskName: '카메라 장비 관리 및 주문',
                coreContent: 'WSOP SC 카메라 장비 관리 및 주문',
                progress: '30%',
                link: '링크'
            },
            row24: {
                taskName: 'GFX 시연 테스트 환경 구축',
                coreContent: 'NSUS 와의 협업을 위한 GFX 시연 테스트 환경 구축',
                progress: '10%',
                link: '링크'
            }
        };
        
        // 4. 새로운 데이터
        const newData = {
            row22: {
                taskName: '카메라 렌즈 정기 점검',
                coreContent: '전체 카메라 렌즈 청소 및 초점 재조정으로 화질 개선',
                progress: '50%'
            },
            row23: {
                taskName: 'PTZ 카메라 신규 설치',
                coreContent: '원격 제어 가능한 PTZ 카메라 2대 설치로 촬영 범위 확대',
                progress: '50%'
            },
            row24: {
                taskName: '스트리밍 설정 최적화',
                coreContent: '비트레이트 조정 및 인코딩 설정으로 실시간 방송 품질 향상',
                progress: '50%'
            }
        };
        
        // 5. replaceAllText 요청 생성
        const requests = [];
        
        // 행 22 업데이트
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row22.taskName,
                    matchCase: true
                },
                replaceText: newData.row22.taskName
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row22.coreContent,
                    matchCase: true
                },
                replaceText: newData.row22.coreContent
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row22.progress,
                    matchCase: true
                },
                replaceText: newData.row22.progress
            }
        });
        
        // 행 23 업데이트
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row23.taskName,
                    matchCase: true
                },
                replaceText: newData.row23.taskName
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row23.coreContent,
                    matchCase: true
                },
                replaceText: newData.row23.coreContent
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row23.progress,
                    matchCase: true
                },
                replaceText: newData.row23.progress
            }
        });
        if (currentData.row23.link) {
            requests.push({
                replaceAllText: {
                    containsText: {
                        text: currentData.row23.link,
                        matchCase: true
                    },
                    replaceText: ''
                }
            });
        }
        
        // 행 24 업데이트
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row24.taskName,
                    matchCase: true
                },
                replaceText: newData.row24.taskName
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row24.coreContent,
                    matchCase: true
                },
                replaceText: newData.row24.coreContent
            }
        });
        requests.push({
            replaceAllText: {
                containsText: {
                    text: currentData.row24.progress,
                    matchCase: true
                },
                replaceText: newData.row24.progress
            }
        });
        if (currentData.row24.link) {
            requests.push({
                replaceAllText: {
                    containsText: {
                        text: currentData.row24.link,
                        matchCase: true
                    },
                    replaceText: ''
                }
            });
        }
        
        console.log(`📝 ${requests.length}개 업데이트 요청 생성\n`);
        
        // 업데이트 내용 미리보기
        console.log('🔄 업데이트 내용:');
        console.log('─'.repeat(50));
        console.log('행 22:');
        console.log(`  업무: ${currentData.row22.taskName} → ${newData.row22.taskName}`);
        console.log(`  내용: ${currentData.row22.coreContent} → ${newData.row22.coreContent}`);
        console.log(`  진행: ${currentData.row22.progress} → ${newData.row22.progress}`);
        console.log('');
        console.log('행 23:');
        console.log(`  업무: ${currentData.row23.taskName} → ${newData.row23.taskName}`);
        console.log(`  내용: ${currentData.row23.coreContent} → ${newData.row23.coreContent}`);
        console.log(`  진행: ${currentData.row23.progress} → ${newData.row23.progress}`);
        console.log(`  링크: ${currentData.row23.link} → (삭제)`);
        console.log('');
        console.log('행 24:');
        console.log(`  업무: ${currentData.row24.taskName} → ${newData.row24.taskName}`);
        console.log(`  내용: ${currentData.row24.coreContent} → ${newData.row24.coreContent}`);
        console.log(`  진행: ${currentData.row24.progress} → ${newData.row24.progress}`);
        console.log(`  링크: ${currentData.row24.link} → (삭제)`);
        console.log('');
        
        // 6. 업데이트 실행
        console.log('🚀 업데이트 실행 중...');
        
        const response = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: requests
            }
        });
        
        console.log('✅ 업데이트 완료!');
        console.log(`처리된 요청: ${response.data.replies?.length || 0}개`);
        
        console.log('\n🎉 카메라 파트 업데이트 성공!');
        
    } catch (error) {
        console.error('❌ 오류:', error.message);
        if (error.response && error.response.data) {
            console.error('상세:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// 실행
if (require.main === module) {
    simpleUpdateCamera().catch(console.error);
}

module.exports = { simpleUpdateCamera };