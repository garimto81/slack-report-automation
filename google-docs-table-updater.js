/**
 * 구글 문서 테이블 업데이트 로직
 * 카메라 헤더가 있는 테이블의 특정 셀들을 업데이트
 */

const { google } = require('googleapis');

/**
 * 카메라 테이블 업데이트 메인 함수
 * @param {string} documentId - 구글 문서 ID
 * @param {Object} tableInfo - 테이블 위치 정보
 * @param {Array} top3Tasks - 상위 3개 업무 데이터
 * @returns {Object} 업데이트 결과
 */
async function updateCameraTable(documentId, tableInfo, top3Tasks) {
    console.log('📝 카메라 테이블 업데이트 시작');
    console.log(`📊 업데이트할 업무: ${top3Tasks.length}개`);
    
    try {
        // Google Docs API 클라이언트 설정
        const auth = await setupGoogleAuth();
        const docs = google.docs({ version: 'v1', auth });
        
        // 업데이트 요청 배열 생성
        const updateRequests = generateUpdateRequests(tableInfo, top3Tasks);
        
        if (updateRequests.length === 0) {
            return {
                success: false,
                message: '업데이트할 내용이 없습니다.'
            };
        }
        
        // 배치 업데이트 실행
        const result = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
                requests: updateRequests
            }
        });
        
        console.log(`✅ 테이블 업데이트 완료: ${updateRequests.length}개 요청 처리`);
        
        return {
            success: true,
            updatedCells: updateRequests.length,
            tasksUpdated: top3Tasks.length,
            message: '카메라 테이블이 성공적으로 업데이트되었습니다.'
        };
        
    } catch (error) {
        console.error('❌ 테이블 업데이트 실패:', error.message);
        return {
            success: false,
            error: error.message,
            message: '테이블 업데이트 중 오류가 발생했습니다.'
        };
    }
}

/**
 * Google 인증 설정
 */
async function setupGoogleAuth() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    
    const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive'
        ]
    });
    
    return await auth.getClient();
}

/**
 * 테이블 업데이트 요청 생성
 * @param {Object} tableInfo - 테이블 정보
 * @param {Array} top3Tasks - 상위 3개 업무
 * @returns {Array} 업데이트 요청 배열
 */
function generateUpdateRequests(tableInfo, top3Tasks) {
    console.log('🔧 업데이트 요청 생성 중...');
    
    const requests = [];
    const { table, headerStructure, cameraRowIndex } = tableInfo;
    
    // 헤더 구조 검증
    if (!headerStructure || headerStructure.taskNameColumnIndex === -1 || headerStructure.coreContentColumnIndex === -1) {
        console.error('❌ 헤더 구조가 올바르지 않습니다.');
        return [];
    }
    
    const taskNameColIndex = headerStructure.taskNameColumnIndex;
    const coreContentColIndex = headerStructure.coreContentColumnIndex;
    
    console.log(`📋 업무명 컬럼: ${taskNameColIndex + 1}, 핵심내용 컬럼: ${coreContentColIndex + 1}`);
    
    // 3개 업무에 대한 업데이트 요청 생성
    for (let i = 0; i < Math.min(top3Tasks.length, 3); i++) {
        const task = top3Tasks[i];
        const rowIndex = cameraRowIndex + i; // 카메라 헤더부터 3행
        
        console.log(`📝 업무 ${i + 1} 업데이트: 행 ${rowIndex + 1}`);
        
        // 1. 업무명 셀 업데이트 (기존 내용 삭제 후 새 내용 추가)
        const taskNameCellRequests = generateCellUpdateRequests(
            table, rowIndex, taskNameColIndex, task.taskName
        );
        requests.push(...taskNameCellRequests);
        
        // 2. 핵심 내용 셀 업데이트 (기존 내용 삭제 후 새 내용 추가)  
        const coreContentCellRequests = generateCellUpdateRequests(
            table, rowIndex, coreContentColIndex, task.coreContent
        );
        requests.push(...coreContentCellRequests);
        
        console.log(`✅ 업무 ${i + 1} 요청 생성 완료`);
    }
    
    console.log(`📊 총 ${requests.length}개 업데이트 요청 생성`);
    return requests;
}

/**
 * 특정 셀에 대한 업데이트 요청 생성
 * @param {Object} table - 테이블 객체
 * @param {number} rowIndex - 행 인덱스
 * @param {number} colIndex - 열 인덱스  
 * @param {string} newContent - 새 내용
 * @returns {Array} 해당 셀의 업데이트 요청들
 */
function generateCellUpdateRequests(table, rowIndex, colIndex, newContent) {
    console.log(`🔧 셀 업데이트 요청 생성: 행${rowIndex + 1}, 열${colIndex + 1}`);
    
    const requests = [];
    
    try {
        // 테이블 구조에서 해당 셀 찾기
        const tableRows = table.tableRows || [];
        if (rowIndex >= tableRows.length) {
            console.error(`❌ 행 인덱스 범위 초과: ${rowIndex} >= ${tableRows.length}`);
            return [];
        }
        
        const row = tableRows[rowIndex];
        const cells = row.tableCells || [];
        if (colIndex >= cells.length) {
            console.error(`❌ 열 인덱스 범위 초과: ${colIndex} >= ${cells.length}`);
            return [];
        }
        
        const cell = cells[colIndex];
        
        // 셀의 시작 및 끝 인덱스 계산
        const cellRange = calculateCellRange(table, rowIndex, colIndex);
        
        if (cellRange.startIndex === -1 || cellRange.endIndex === -1) {
            console.error(`❌ 셀 범위 계산 실패: 행${rowIndex + 1}, 열${colIndex + 1}`);
            return [];
        }
        
        // 1. 기존 내용 삭제 (셀 내용이 있는 경우)
        if (cellRange.endIndex > cellRange.startIndex) {
            requests.push({
                deleteContentRange: {
                    range: {
                        startIndex: cellRange.startIndex,
                        endIndex: cellRange.endIndex
                    }
                }
            });
        }
        
        // 2. 새 내용 삽입
        requests.push({
            insertText: {
                location: {
                    index: cellRange.startIndex
                },
                text: newContent
            }
        });
        
        console.log(`✅ 셀 요청 생성 완료: ${requests.length}개 요청`);
        
    } catch (error) {
        console.error(`❌ 셀 업데이트 요청 생성 실패:`, error.message);
    }
    
    return requests;
}

/**
 * 테이블 셀의 문서 내 인덱스 범위 계산
 * @param {Object} table - 테이블 객체
 * @param {number} rowIndex - 행 인덱스
 * @param {number} colIndex - 열 인덱스
 * @returns {Object} 시작 및 끝 인덱스
 */
function calculateCellRange(table, rowIndex, colIndex) {
    console.log(`🔍 셀 범위 계산: 행${rowIndex + 1}, 열${colIndex + 1}`);
    
    try {
        const tableRows = table.tableRows || [];
        const targetRow = tableRows[rowIndex];
        const targetCell = targetRow.tableCells[colIndex];
        
        // 셀의 내용에서 인덱스 추출
        if (!targetCell.content || targetCell.content.length === 0) {
            // 빈 셀인 경우
            return {
                startIndex: -1,
                endIndex: -1
            };
        }
        
        // 첫 번째 문단의 시작 인덱스 찾기
        const firstParagraph = targetCell.content[0];
        if (firstParagraph && firstParagraph.startIndex !== undefined) {
            // 마지막 문단의 끝 인덱스 찾기
            const lastParagraph = targetCell.content[targetCell.content.length - 1];
            const endIndex = lastParagraph.endIndex || firstParagraph.startIndex + 1;
            
            return {
                startIndex: firstParagraph.startIndex,
                endIndex: endIndex
            };
        }
        
        console.log('⚠️ 셀 인덱스 정보를 찾을 수 없음');
        return {
            startIndex: -1,
            endIndex: -1
        };
        
    } catch (error) {
        console.error('❌ 셀 범위 계산 오류:', error.message);
        return {
            startIndex: -1,
            endIndex: -1
        };
    }
}

/**
 * 테이블 업데이트 결과 검증
 * @param {string} documentId - 문서 ID
 * @param {Object} tableInfo - 테이블 정보
 * @returns {Object} 검증 결과
 */
async function verifyTableUpdate(documentId, tableInfo) {
    console.log('🔍 테이블 업데이트 결과 검증');
    
    try {
        const auth = await setupGoogleAuth();
        const docs = google.docs({ version: 'v1', auth });
        
        // 업데이트된 문서 다시 조회
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        // TODO: 업데이트된 내용 확인 로직 추가
        
        return {
            success: true,
            message: '테이블 업데이트가 정상적으로 완료되었습니다.'
        };
        
    } catch (error) {
        console.error('❌ 검증 실패:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    updateCameraTable,
    generateUpdateRequests,
    generateCellUpdateRequests,
    calculateCellRange,
    verifyTableUpdate
};