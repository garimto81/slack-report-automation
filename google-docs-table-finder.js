/**
 * 구글 문서에서 특정 탭과 '카메라' 헤더가 있는 표를 찾는 로직
 */

const { google } = require('googleapis');

/**
 * 구글 문서 탭 및 카메라 헤더 찾기 메인 함수
 * @param {string} documentId - 구글 문서 ID
 * @returns {Object} 찾은 탭과 테이블 정보
 */
async function findCameraTableInDocument(documentId = '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow') {
    console.log('🔍 구글 문서에서 카메라 테이블 탐색 시작');
    console.log(`📄 문서 ID: ${documentId}`);
    
    try {
        // Google Docs API 클라이언트 설정
        const auth = await setupGoogleAuth();
        const docs = google.docs({ version: 'v1', auth });
        
        // 1단계: 오늘 날짜 기반 탭 이름 생성
        const todayTabName = generateTodayTabName();
        console.log(`📅 찾을 탭 이름 패턴: ${todayTabName}`);
        
        // 2단계: 문서 구조 분석
        const document = await docs.documents.get({
            documentId: documentId
        });
        
        // 3단계: 탭 찾기
        const targetTab = findTabByDate(document.data, todayTabName);
        if (!targetTab) {
            return {
                success: false,
                message: `오늘 날짜 탭(${todayTabName})을 찾을 수 없습니다.`,
                availableTabs: getAvailableTabs(document.data)
            };
        }
        
        console.log(`✅ 대상 탭 발견: "${targetTab.title}"`);
        
        // 4단계: 카메라 헤더가 있는 테이블 찾기
        const cameraTable = await findCameraTable(document.data, targetTab);
        
        if (!cameraTable) {
            return {
                success: false,
                message: '카메라 헤더가 있는 테이블을 찾을 수 없습니다.',
                tabFound: targetTab.title
            };
        }
        
        console.log(`✅ 카메라 테이블 발견!`);
        console.log(`📊 테이블 위치: 행 ${cameraTable.cameraRowIndex + 1}부터 3개 행`);
        
        return {
            success: true,
            documentId: documentId,
            tab: targetTab,
            table: cameraTable,
            message: '카메라 테이블을 성공적으로 찾았습니다.'
        };
        
    } catch (error) {
        console.error('❌ 문서 탐색 중 오류:', error.message);
        return {
            success: false,
            error: error.message,
            message: '문서 탐색 중 오류가 발생했습니다.'
        };
    }
}

/**
 * 오늘 날짜 기반 탭 이름 생성 (YYMMDD 형식)
 * @returns {string} 오늘 날짜 탭 이름
 */
function generateTodayTabName() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2); // 25 (2025년)
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // 08
    const day = today.getDate().toString().padStart(2, '0'); // 07
    
    const dateString = `${year}${month}${day}`; // 250807
    console.log(`📅 오늘 날짜: ${today.toLocaleDateString('ko-KR')} → ${dateString}`);
    
    return dateString;
}

/**
 * Google 인증 설정
 * @returns {Object} 인증된 클라이언트
 */
async function setupGoogleAuth() {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
        
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        const authClient = await auth.getClient();
        return authClient;
        
    } catch (error) {
        throw new Error('Google 인증에 실패했습니다. GOOGLE_SERVICE_ACCOUNT_KEY를 확인해주세요.');
    }
}

/**
 * 날짜 기반 탭 찾기
 * @param {Object} documentData - 구글 문서 데이터
 * @param {string} targetDate - 찾을 날짜 (YYMMDD)
 * @returns {Object|null} 찾은 탭 정보
 */
function findTabByDate(documentData, targetDate) {
    console.log(`🔍 "${targetDate}" 패턴이 포함된 탭 찾기`);
    
    // 문서의 탭들 확인
    const tabs = documentData.tabs || [];
    console.log(`📋 총 탭 개수: ${tabs.length}개`);
    
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const tabTitle = tab.tabProperties?.title || `탭${i + 1}`;
        
        console.log(`🔍 탭 ${i + 1}: "${tabTitle}"`);
        
        // 탭 제목에 날짜 패턴이 포함되어 있는지 확인
        if (tabTitle.includes(targetDate)) {
            console.log(`✅ 일치하는 탭 발견: "${tabTitle}"`);
            return {
                index: i,
                title: tabTitle,
                tabId: tab.tabProperties?.tabId,
                ...tab
            };
        }
    }
    
    console.log(`❌ "${targetDate}" 패턴을 포함한 탭을 찾지 못했습니다.`);
    return null;
}

/**
 * 사용 가능한 탭 목록 조회
 * @param {Object} documentData - 구글 문서 데이터  
 * @returns {Array} 탭 목록
 */
function getAvailableTabs(documentData) {
    const tabs = documentData.tabs || [];
    return tabs.map((tab, index) => ({
        index: index,
        title: tab.tabProperties?.title || `탭${index + 1}`,
        tabId: tab.tabProperties?.tabId
    }));
}

/**
 * 카메라 헤더가 있는 테이블 찾기
 * @param {Object} documentData - 구글 문서 데이터
 * @param {Object} targetTab - 대상 탭
 * @returns {Object|null} 카메라 테이블 정보
 */
async function findCameraTable(documentData, targetTab) {
    console.log('🔍 카메라 헤더가 있는 테이블 탐색');
    
    // 해당 탭의 내용 가져오기
    const tabContent = targetTab.documentTab?.body || documentData.body;
    
    if (!tabContent || !tabContent.content) {
        console.log('❌ 탭 내용을 찾을 수 없습니다.');
        return null;
    }
    
    // 테이블 요소들 찾기
    const tables = [];
    
    for (let i = 0; i < tabContent.content.length; i++) {
        const element = tabContent.content[i];
        
        if (element.table) {
            console.log(`📊 테이블 ${tables.length + 1} 발견 (인덱스 ${i})`);
            
            const tableInfo = analyzeTable(element.table, i);
            if (tableInfo.hasCameraHeader) {
                console.log(`✅ 카메라 헤더 발견! 테이블 ${tables.length + 1}`);
                return {
                    ...tableInfo,
                    elementIndex: i,
                    table: element.table
                };
            }
            
            tables.push(tableInfo);
        }
    }
    
    console.log(`📊 총 ${tables.length}개 테이블 분석 완료, 카메라 헤더 없음`);
    return null;
}

/**
 * 테이블 분석하여 카메라 헤더 찾기
 * @param {Object} table - 테이블 객체
 * @param {number} elementIndex - 요소 인덱스
 * @returns {Object} 테이블 분석 결과
 */
function analyzeTable(table, elementIndex) {
    console.log(`🔍 테이블 분석 (요소 인덱스: ${elementIndex})`);
    
    const rows = table.tableRows || [];
    console.log(`📏 행 개수: ${rows.length}개`);
    
    let hasCameraHeader = false;
    let cameraRowIndex = -1;
    let headerStructure = {};
    
    // 각 행을 분석하여 카메라 헤더 찾기
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const cells = row.tableCells || [];
        
        console.log(`📏 행 ${rowIndex + 1}: ${cells.length}개 셀`);
        
        // 각 셀의 텍스트 내용 확인
        for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
            const cell = cells[cellIndex];
            const cellText = extractCellText(cell);
            
            console.log(`  📝 셀 ${cellIndex + 1}: "${cellText}"`);
            
            // '카메라' 텍스트 찾기
            if (cellText.includes('카메라')) {
                console.log(`✅ '카메라' 헤더 발견! 행 ${rowIndex + 1}, 셀 ${cellIndex + 1}`);
                hasCameraHeader = true;
                cameraRowIndex = rowIndex;
                
                // 헤더 구조 분석
                headerStructure = analyzeHeaderStructure(rows, rowIndex);
                break;
            }
        }
        
        if (hasCameraHeader) break;
    }
    
    return {
        elementIndex,
        hasCameraHeader,
        cameraRowIndex,
        headerStructure,
        totalRows: rows.length,
        tableRows: rows
    };
}

/**
 * 셀에서 텍스트 추출
 * @param {Object} cell - 테이블 셀
 * @returns {string} 추출된 텍스트
 */
function extractCellText(cell) {
    if (!cell.content) return '';
    
    let text = '';
    
    for (const element of cell.content) {
        if (element.paragraph && element.paragraph.elements) {
            for (const elem of element.paragraph.elements) {
                if (elem.textRun && elem.textRun.content) {
                    text += elem.textRun.content;
                }
            }
        }
    }
    
    return text.trim();
}

/**
 * 헤더 구조 분석 (3행 병합 확인)
 * @param {Array} rows - 모든 행
 * @param {number} cameraRowIndex - 카메라 헤더가 있는 행 인덱스
 * @returns {Object} 헤더 구조 정보
 */
function analyzeHeaderStructure(rows, cameraRowIndex) {
    console.log(`🔍 헤더 구조 분석: 행 ${cameraRowIndex + 1}부터 3행 병합 확인`);
    
    const headerRow = rows[cameraRowIndex];
    const cells = headerRow.tableCells || [];
    
    // 헤더 컬럼 확인
    const headers = [];
    for (let i = 0; i < cells.length; i++) {
        const cellText = extractCellText(cells[i]);
        headers.push(cellText);
        console.log(`📝 헤더 ${i + 1}: "${cellText}"`);
    }
    
    // '파트', '우선순위', '진행 중인 업무 명칭', '핵심 내용' 헤더 찾기
    const expectedHeaders = ['파트', '우선순위', '진행 중인 업무 명칭', '핵심 내용'];
    const headerMap = {};
    
    expectedHeaders.forEach(expectedHeader => {
        const foundIndex = headers.findIndex(header => 
            header.includes(expectedHeader) || header.includes(expectedHeader.replace(/\s+/g, ''))
        );
        if (foundIndex !== -1) {
            headerMap[expectedHeader] = foundIndex;
            console.log(`✅ "${expectedHeader}" 헤더 발견: 컬럼 ${foundIndex + 1}`);
        } else {
            console.log(`⚠️ "${expectedHeader}" 헤더 미발견`);
        }
    });
    
    return {
        cameraRowIndex,
        headers,
        headerMap,
        expectedRows: 3, // 카메라 헤더는 3행 병합
        taskNameColumnIndex: headerMap['진행 중인 업무 명칭'] || -1,
        coreContentColumnIndex: headerMap['핵심 내용'] || -1,
        priorityColumnIndex: headerMap['우선순위'] || -1
    };
}

module.exports = {
    findCameraTableInDocument,
    generateTodayTabName,
    findTabByDate,
    findCameraTable,
    analyzeTable,
    extractCellText
};