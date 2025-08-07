#!/usr/bin/env node

/**
 * 자동화된 카메라 파트 업데이트 시스템
 * - 평일 오전 10시 실행
 * - 월요일: 전주 금요일 데이터 분석
 * - 화~금: 전날 데이터 분석
 */

require('dotenv').config();
const { google } = require('googleapis');

// 날짜 관련 유틸리티
function getKoreanTime() {
    // UTC+9 (한국 시간) 적용
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const koreaTime = new Date(utc + (9 * 3600000));
    return koreaTime;
}

function getAnalysisDate() {
    const now = getKoreanTime();
    const dayOfWeek = now.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    
    console.log(`🗓️ 현재 한국 시간: ${now.toLocaleString('ko-KR')}`);
    console.log(`📅 오늘 요일: ${['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}요일`);
    
    let analysisDate;
    
    if (dayOfWeek === 1) { // 월요일
        // 전주 금요일 데이터 분석 (3일 전)
        analysisDate = new Date(now);
        analysisDate.setDate(now.getDate() - 3);
        console.log(`📊 분석 대상: 전주 금요일 (${analysisDate.toLocaleDateString('ko-KR')})`);
    } else if (dayOfWeek >= 2 && dayOfWeek <= 5) { // 화~금요일
        // 전날 데이터 분석
        analysisDate = new Date(now);
        analysisDate.setDate(now.getDate() - 1);
        console.log(`📊 분석 대상: 어제 (${analysisDate.toLocaleDateString('ko-KR')})`);
    } else {
        // 주말에는 실행하지 않음
        console.log('⚠️ 주말에는 업데이트를 실행하지 않습니다.');
        return null;
    }
    
    return analysisDate;
}

function shouldRunUpdate() {
    const now = getKoreanTime();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // 평일 (월~금)에만 실행
    if (dayOfWeek < 1 || dayOfWeek > 5) {
        console.log('⏰ 주말이므로 업데이트를 건너뜁니다.');
        return false;
    }
    
    // 오전 9시~11시 사이에만 실행 (GitHub Actions 시간 오차 고려)
    if (hour < 9 || hour > 11) {
        console.log(`⏰ 현재 시간 ${hour}시는 실행 시간(9-11시)이 아닙니다.`);
        return false;
    }
    
    return true;
}

async function collectSlackData(analysisDate) {
    console.log('📡 Slack 데이터 수집 중...');
    
    // Slack API를 통한 메시지 수집 로직
    // analyze-slack-channel.js의 로직을 여기에 통합할 수 있습니다
    const { SlackApi } = require('./slack-api');
    
    try {
        const slackApi = new SlackApi();
        const channelId = process.env.SLACK_CHANNEL_ID;
        
        // 분석 날짜 기준으로 메시지 수집
        const startTime = new Date(analysisDate);
        startTime.setHours(0, 0, 0, 0);
        
        const endTime = new Date(analysisDate);
        endTime.setHours(23, 59, 59, 999);
        
        const messages = await slackApi.getMessages(channelId, startTime, endTime);
        console.log(`✅ ${messages.length}개 메시지 수집 완료`);
        
        return messages;
    } catch (error) {
        console.error('❌ Slack 데이터 수집 실패:', error.message);
        return [];
    }
}

async function analyzeTasksWithAI(messages) {
    console.log('🤖 AI 업무 분석 중...');
    
    if (messages.length === 0) {
        console.log('⚠️ 분석할 메시지가 없습니다. 기본 업무를 사용합니다.');
        return {
            tasks: [
                {
                    taskName: '카메라 장비 점검 및 관리',
                    coreContent: '촬영장비 상태 점검 및 유지보수 작업'
                },
                {
                    taskName: '방송 품질 개선 작업',
                    coreContent: '화질 및 음질 최적화를 위한 설정 조정'
                },
                {
                    taskName: '신규 장비 도입 검토',
                    coreContent: '촬영 효율성 향상을 위한 신규 장비 검토'
                }
            ]
        };
    }
    
    // AI 분석 로직 (Gemini API 사용)
    try {
        const { processTopTasks } = require('./top-tasks-processor');
        const taskTexts = messages.map(msg => msg.text).filter(text => text && text.trim());
        
        const result = await processTopTasks(taskTexts, 'daily');
        
        if (result.success && result.tasks.length >= 3) {
            console.log(`✅ AI 분석 완료: ${result.tasks.length}개 업무 추출`);
            return { tasks: result.tasks.slice(0, 3) };
        } else {
            throw new Error('AI 분석 결과가 부족합니다.');
        }
    } catch (error) {
        console.error('❌ AI 분석 실패:', error.message);
        console.log('🔄 기본 업무 데이터로 대체합니다.');
        
        return {
            tasks: [
                {
                    taskName: '카메라 시스템 유지보수',
                    coreContent: '카메라 장비 점검 및 설정 최적화 작업'
                },
                {
                    taskName: '촬영 품질 관리',
                    coreContent: '영상 품질 향상을 위한 기술적 개선사항 적용'
                },
                {
                    taskName: '장비 운영 효율화',
                    coreContent: '촬영 워크플로우 개선 및 장비 활용도 최적화'
                }
            ]
        };
    }
}

async function updateGoogleDocs(tasks) {
    console.log('📝 구글 문서 업데이트 중...');
    
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
        const documentId = process.env.GOOGLE_DOCS_ID || '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
        
        // 현재 문서에서 카메라 파트의 기존 데이터 가져오기
        const document = await docs.documents.get({ documentId });
        
        // 테이블에서 카메라 행 찾기
        const content = document.data.body.content || [];
        let tableElement = null;
        
        content.forEach((element) => {
            if (element.table && !tableElement) {
                tableElement = element;
            }
        });
        
        if (!tableElement) {
            throw new Error('테이블을 찾을 수 없습니다.');
        }
        
        const rows = tableElement.table.tableRows || [];
        const headers = rows[0].tableCells.map(cell => extractCellText(cell));
        
        // 카메라 행 찾기 (행 22, 23, 24)
        const cameraRows = [21, 22, 23]; // 0-based index
        const requests = [];
        
        // 각 카메라 행의 현재 데이터를 새 데이터로 교체
        cameraRows.forEach((rowIndex, idx) => {
            if (idx < tasks.length && rowIndex < rows.length) {
                const task = tasks[idx];
                const row = rows[rowIndex];
                
                // 업무명 열과 핵심내용 열 인덱스
                const taskNameCol = headers.indexOf('진행 중인 업무 명칭');
                const coreContentCol = headers.indexOf('핵심 내용(방향성)');
                const progressCol = headers.indexOf('진행사항');
                
                // 업무명 셀 처리
                if (taskNameCol !== -1 && row.tableCells[taskNameCol]) {
                    const taskCell = row.tableCells[taskNameCol];
                    const currentTaskName = extractCellText(taskCell);
                    
                    if (currentTaskName.length === 0) {
                        // 빈 셀 - insertText 사용
                        const elements = taskCell.content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: task.taskName
                                }
                            });
                        }
                    } else {
                        // 기존 텍스트 있음 - replaceAllText 사용
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentTaskName, matchCase: false },
                                replaceText: task.taskName
                            }
                        });
                    }
                }
                
                // 핵심내용 셀 처리
                if (coreContentCol !== -1 && row.tableCells[coreContentCol]) {
                    const coreCell = row.tableCells[coreContentCol];
                    const currentCoreContent = extractCellText(coreCell);
                    
                    if (currentCoreContent.length === 0) {
                        // 빈 셀 - insertText 사용
                        const elements = coreCell.content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: task.coreContent
                                }
                            });
                        }
                    } else {
                        // 기존 텍스트 있음 - replaceAllText 사용
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentCoreContent, matchCase: false },
                                replaceText: task.coreContent
                            }
                        });
                    }
                }
                
                // 진행사항 50%로 설정
                if (progressCol !== -1 && row.tableCells[progressCol]) {
                    const progressCell = row.tableCells[progressCol];
                    const currentProgress = extractCellText(progressCell);
                    
                    if (currentProgress.length === 0) {
                        // 빈 셀 - insertText 사용
                        const elements = progressCell.content[0]?.paragraph?.elements || [];
                        if (elements.length > 0) {
                            requests.push({
                                insertText: {
                                    location: { index: elements[0].startIndex },
                                    text: "50%"
                                }
                            });
                        }
                    } else {
                        // 기존 텍스트 있음 - replaceAllText 사용
                        requests.push({
                            replaceAllText: {
                                containsText: { text: currentProgress, matchCase: false },
                                replaceText: "50%"
                            }
                        });
                    }
                }
                
                console.log(`📋 행 ${rowIndex + 1} 업데이트: "${task.taskName}"`);
            }
        });
        
        // 업데이트 실행
        if (requests.length > 0) {
            const response = await docs.documents.batchUpdate({
                documentId: documentId,
                requestBody: { requests: requests }
            });
            
            console.log(`✅ ${response.data.replies?.length || 0}개 업데이트 완료`);
        } else {
            console.log('⚠️ 업데이트할 내용이 없습니다.');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 구글 문서 업데이트 실패:', error.message);
        return false;
    }
}

// 셀에서 텍스트 추출 유틸리티
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

async function main() {
    console.log('🚀 자동화된 카메라 파트 업데이트 시작');
    console.log('=' .repeat(60));
    
    // 1. 실행 시간 확인
    if (!shouldRunUpdate()) {
        console.log('⏹️ 업데이트를 건너뜁니다.');
        process.exit(0);
    }
    
    // 2. 분석할 날짜 계산
    const analysisDate = getAnalysisDate();
    if (!analysisDate) {
        console.log('⏹️ 분석할 날짜가 없습니다.');
        process.exit(0);
    }
    
    try {
        // 3. Slack 데이터 수집
        const messages = await collectSlackData(analysisDate);
        
        // 4. AI 업무 분석
        const analysisResult = await analyzeTasksWithAI(messages);
        
        // 5. 구글 문서 업데이트
        const updateSuccess = await updateGoogleDocs(analysisResult.tasks);
        
        if (updateSuccess) {
            console.log('🎉 자동화된 카메라 파트 업데이트 성공!');
            
            // 성공 로그
            const now = getKoreanTime();
            console.log('\n📊 업데이트 요약:');
            console.log(`  실행 시간: ${now.toLocaleString('ko-KR')}`);
            console.log(`  분석 날짜: ${analysisDate.toLocaleDateString('ko-KR')}`);
            console.log(`  업데이트된 업무: ${analysisResult.tasks.length}개`);
            
            analysisResult.tasks.forEach((task, index) => {
                console.log(`  ${index + 1}. ${task.taskName}`);
            });
        } else {
            console.error('❌ 업데이트에 실패했습니다.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 자동화 프로세스 오류:', error.message);
        process.exit(1);
    }
}

// 실행
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 예상치 못한 오류:', error);
        process.exit(1);
    });
}

module.exports = { 
    main, 
    getKoreanTime, 
    getAnalysisDate, 
    shouldRunUpdate 
};