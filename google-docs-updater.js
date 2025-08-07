/**
 * Google Docs 업데이트 서비스
 * 제목과 업무 내용을 Google 문서에 추가하는 전용 서비스
 */

const { google } = require('googleapis');
const { generateSimpleTitle } = require('./title-generator');
const { ensureMinimumTasks } = require('./minimum-tasks-algorithm');

/**
 * Google Docs 업데이트 메인 함수
 * @param {string} reportType - 보고서 타입 ('daily', 'weekly', 'monthly')
 * @param {Object} options - 추가 옵션
 * @returns {Object} 업데이트 결과
 */
async function updateGoogleDocs(reportType = 'daily', options = {}) {
    console.log('📝 Google Docs 업데이트 프로세스 시작');
    console.log(`📊 보고서 타입: ${reportType}`);
    
    try {
        // 1단계: 최소 3개 업무 확보
        console.log('\n🎯 1단계: 최소 업무 개수 확보');
        const taskResult = await ensureMinimumTasks(reportType, options.minTaskCount || 3);
        
        if (!taskResult.tasks || taskResult.tasks.length === 0) {
            console.log('⚠️ 업무를 찾을 수 없습니다.');
            return {
                success: false,
                message: '업무 데이터가 없습니다.',
                tasksFound: 0
            };
        }
        
        console.log(`✅ 업무 확보 완료: ${taskResult.tasksCount}개`);
        if (taskResult.expandedFrom) {
            console.log(`📈 ${taskResult.expandedFrom} → ${taskResult.reportType}로 확장됨`);
        }
        
        // 2단계: 제목 생성
        console.log('\n📝 2단계: 간략한 제목 생성');
        const title = await generateSimpleTitle(taskResult.tasks, taskResult.reportType, options);
        console.log(`✅ 생성된 제목: "${title}"`);
        
        // 3단계: Google Docs 업데이트
        console.log('\n📄 3단계: Google Docs 업데이트');
        const docsResult = await writeToGoogleDocs(title, taskResult.tasks, options);
        
        return {
            success: true,
            title: title,
            tasksCount: taskResult.tasksCount,
            reportType: taskResult.reportType,
            expandedFrom: taskResult.expandedFrom,
            documentId: docsResult.documentId,
            documentUrl: docsResult.documentUrl,
            message: `${taskResult.tasksCount}개 업무로 Google Docs 업데이트 완료`
        };
        
    } catch (error) {
        console.error('❌ Google Docs 업데이트 실패:', error.message);
        return {
            success: false,
            error: error.message,
            message: 'Google Docs 업데이트 중 오류 발생'
        };
    }
}

/**
 * Google Docs에 내용 작성
 * @param {string} title - 문서 제목
 * @param {Array} tasks - 업무 목록
 * @param {Object} options - 추가 옵션
 * @returns {Object} 작성 결과
 */
async function writeToGoogleDocs(title, tasks, options = {}) {
    console.log('📄 Google Docs 작성 시작');
    
    try {
        // Google Docs API 클라이언트 설정
        const auth = await setupGoogleAuth();
        const docs = google.docs({ version: 'v1', auth });
        
        // 문서 ID 확인 또는 새 문서 생성
        const documentId = options.documentId || await createNewDocument(docs, title);
        console.log(`📋 문서 ID: ${documentId}`);
        
        // 문서 내용 구성
        const content = formatDocumentContent(title, tasks, options);
        
        // 문서 업데이트
        await updateDocumentContent(docs, documentId, content);
        
        const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
        console.log(`✅ Google Docs 업데이트 완료: ${documentUrl}`);
        
        return {
            documentId: documentId,
            documentUrl: documentUrl,
            tasksWritten: tasks.length
        };
        
    } catch (error) {
        console.error('❌ Google Docs 작성 실패:', error.message);
        throw error;
    }
}

/**
 * Google 인증 설정
 * @returns {Object} 인증된 클라이언트
 */
async function setupGoogleAuth() {
    try {
        // 환경변수에서 서비스 계정 정보 읽기
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
        
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const authClient = await auth.getClient();
        console.log('✅ Google 인증 완료');
        return authClient;
        
    } catch (error) {
        console.error('❌ Google 인증 실패:', error.message);
        throw new Error('Google 인증에 실패했습니다. GOOGLE_SERVICE_ACCOUNT_KEY를 확인해주세요.');
    }
}

/**
 * 새 Google 문서 생성
 * @param {Object} docs - Google Docs API 클라이언트
 * @param {string} title - 문서 제목
 * @returns {string} 문서 ID
 */
async function createNewDocument(docs, title) {
    try {
        const currentDate = new Date().toLocaleDateString('ko-KR');
        const documentTitle = `${title} (${currentDate})`;
        
        const response = await docs.documents.create({
            requestBody: {
                title: documentTitle
            }
        });
        
        console.log(`📄 새 문서 생성: "${documentTitle}"`);
        return response.data.documentId;
        
    } catch (error) {
        console.error('❌ 문서 생성 실패:', error.message);
        throw error;
    }
}

/**
 * 문서 내용 포맷팅
 * @param {string} title - 제목
 * @param {Array} tasks - 업무 목록
 * @param {Object} options - 포맷 옵션
 * @returns {Array} 포맷된 요청 배열
 */
function formatDocumentContent(title, tasks, options = {}) {
    const requests = [];
    let currentIndex = 1; // 문서 시작 위치
    
    // 제목 삽입
    requests.push({
        insertText: {
            location: { index: currentIndex },
            text: `${title}\n\n`
        }
    });
    currentIndex += title.length + 2;
    
    // 제목 스타일 적용
    requests.push({
        updateTextStyle: {
            range: {
                startIndex: 1,
                endIndex: title.length + 1
            },
            textStyle: {
                bold: true,
                fontSize: { magnitude: 16, unit: 'PT' }
            },
            fields: 'bold,fontSize'
        }
    });
    
    // 업무 내용 삽입
    const tasksHeader = '업무 내용\n';
    requests.push({
        insertText: {
            location: { index: currentIndex },
            text: tasksHeader
        }
    });
    currentIndex += tasksHeader.length;
    
    // 업무 내용 헤더 스타일
    requests.push({
        updateTextStyle: {
            range: {
                startIndex: currentIndex - tasksHeader.length,
                endIndex: currentIndex
            },
            textStyle: {
                bold: true,
                fontSize: { magnitude: 14, unit: 'PT' }
            },
            fields: 'bold,fontSize'
        }
    });
    
    // 각 업무 항목 추가
    tasks.forEach((task, index) => {
        const taskText = typeof task === 'string' ? task : task.task || task.name || '업무 내용 없음';
        const taskLine = `${index + 1}. ${taskText}\n`;
        
        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: taskLine
            }
        });
        currentIndex += taskLine.length;
    });
    
    // 작성 시간 추가
    const timestamp = `\n\n작성 시간: ${new Date().toLocaleString('ko-KR')}\n`;
    requests.push({
        insertText: {
            location: { index: currentIndex },
            text: timestamp
        }
    });
    
    return requests;
}

/**
 * 문서 내용 업데이트
 * @param {Object} docs - Google Docs API 클라이언트
 * @param {string} documentId - 문서 ID
 * @param {Array} requests - 업데이트 요청 배열
 */
async function updateDocumentContent(docs, documentId, requests) {
    try {
        await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: requests
            }
        });
        
        console.log(`✅ 문서 업데이트 완료: ${requests.length}개 요청 처리`);
        
    } catch (error) {
        console.error('❌ 문서 업데이트 실패:', error.message);
        throw error;
    }
}

/**
 * 문서 공유 설정 (선택사항)
 * @param {string} documentId - 문서 ID
 * @param {Array} emails - 공유할 이메일 목록
 */
async function shareDocument(documentId, emails = []) {
    if (!emails.length) return;
    
    try {
        const auth = await setupGoogleAuth();
        const drive = google.drive({ version: 'v3', auth });
        
        for (const email of emails) {
            await drive.permissions.create({
                fileId: documentId,
                requestBody: {
                    role: 'reader', // 또는 'writer', 'editor'
                    type: 'user',
                    emailAddress: email
                }
            });
            console.log(`📤 문서 공유 완료: ${email}`);
        }
        
    } catch (error) {
        console.error('❌ 문서 공유 실패:', error.message);
    }
}

module.exports = {
    updateGoogleDocs,
    writeToGoogleDocs,
    createNewDocument,
    shareDocument
};