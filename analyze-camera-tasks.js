require('dotenv').config();
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 한국 시간으로 오늘 날짜 가져오기
function getTodayDateKST() {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const kstTime = new Date(now.getTime() + (now.getTimezoneOffset() + kstOffset) * 60 * 1000);
  
  const year = String(kstTime.getFullYear()).slice(-2);
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const day = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}

// Google Docs 인증
async function authenticateDocs() {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/documents']
  });
  
  return google.docs({ version: 'v1', auth });
}

// Gemini AI 초기화
function initializeGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-pro' });
}

// 테이블 셀에서 텍스트 추출
function getTextFromTableCell(cell) {
  if (!cell || !cell.content) return '';
  
  let text = '';
  for (const element of cell.content) {
    if (element.paragraph && element.paragraph.elements) {
      for (const textElement of element.paragraph.elements) {
        if (textElement.textRun && textElement.textRun.content) {
          text += textElement.textRun.content;
        }
      }
    }
  }
  return text.trim();
}

// Gemini AI로 업무 분석
async function analyzeTasksWithGemini(existingTasks) {
  const model = initializeGemini();
  
  const prompt = `
다음은 카메라 파트의 현재 진행 중인 업무 목록입니다:

${existingTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

위 업무들을 분석하여 우선순위가 가장 높은 3개의 업무를 선정하고, 각각에 대해 다음 정보를 제공해주세요:

1. 진행 중인 업무 명칭: (간결하게)
2. 핵심 내용(방향성): (1-2문장으로 업무의 중요성과 목적 설명)
3. 진행사항: (예: 10%, 50%, 90% 등)

우선순위 판단 기준:
- 긴급도와 중요도
- 비즈니스 임팩트
- 의존성과 선후관계
- 고객/클라이언트 관련 여부

JSON 형식으로 응답해주세요:
[
  {
    "task": "업무명",
    "content": "핵심 내용",
    "progress": "진행률"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSON 부분만 추출
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    console.error('AI 응답에서 JSON을 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('Gemini AI 분석 오류:', error);
    return null;
  }
}

// 카메라 파트 행 찾기
function findCameraPartRow(tableRows) {
  for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
    const row = tableRows[rowIndex];
    if (row.tableCells && row.tableCells.length > 0) {
      const firstCellText = getTextFromTableCell(row.tableCells[0]);
      
      // 카메라 파트 찾기
      if (firstCellText.includes('카메라')) {
        console.log(`✅ 카메라 파트를 행 ${rowIndex}에서 찾았습니다.`);
        
        // 다음 행들도 확인 (Aiden Kim 등)
        for (let nextRow = rowIndex; nextRow < Math.min(rowIndex + 5, tableRows.length); nextRow++) {
          const checkRow = tableRows[nextRow];
          const cellText = getTextFromTableCell(checkRow.tableCells[0]);
          
          if (cellText.includes('카메라') || cellText.includes('Aiden') || cellText.includes('에이든')) {
            return {
              rowIndex: nextRow,
              row: checkRow,
              cells: checkRow.tableCells
            };
          }
        }
        
        return {
          rowIndex: rowIndex,
          row: row,
          cells: row.tableCells
        };
      }
    }
  }
  return null;
}

// Google Docs 업데이트
async function updateGoogleDocs(docs, documentId, tableElement, cameraLocation, analyzedTasks) {
  const requests = [];
  
  // 기존 데이터 삭제 (2, 3, 4번째 셀)
  for (let cellIndex = 1; cellIndex < Math.min(4, cameraLocation.cells.length); cellIndex++) {
    const cell = cameraLocation.cells[cellIndex];
    if (cell.content && cell.content.length > 0) {
      for (const element of cell.content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun && textElement.textRun.content && 
                textElement.startIndex && textElement.endIndex) {
              requests.push({
                deleteContentRange: {
                  range: {
                    startIndex: textElement.startIndex,
                    endIndex: textElement.endIndex
                  }
                }
              });
            }
          }
        }
      }
    }
  }
  
  // 높은 인덱스부터 삭제하도록 정렬
  requests.sort((a, b) => {
    const aIndex = a.deleteContentRange?.range?.startIndex || 0;
    const bIndex = b.deleteContentRange?.range?.startIndex || 0;
    return bIndex - aIndex;
  });
  
  // 새 데이터 삽입
  const topTask = analyzedTasks[0];
  const cellContents = [
    topTask.task,           // 진행 중인 업무 명칭
    topTask.content,        // 핵심 내용(방향성)
    topTask.progress        // 진행사항
  ];
  
  // 각 셀에 텍스트 삽입
  for (let i = 0; i < cellContents.length && i < 3; i++) {
    const cellIndex = i + 1; // 첫 번째 셀은 파트 이름
    if (cellIndex < cameraLocation.cells.length) {
      const cell = cameraLocation.cells[cellIndex];
      if (cell.content && cell.content.length > 0) {
        requests.push({
          insertText: {
            location: { index: cell.content[0].startIndex + 1 },
            text: cellContents[i]
          }
        });
      }
    }
  }
  
  // 배치 업데이트 실행
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: documentId,
      requestBody: {
        requests: requests
      }
    });
    
    console.log('✅ Google Docs 업데이트 완료!');
    return true;
  }
  
  return false;
}

// 메인 함수
async function analyzeCameraTasks() {
  try {
    console.log('🔍 카메라 파트 업무 분석 시작...\n');
    
    const docs = await authenticateDocs();
    const documentId = process.env.GOOGLE_DOC_ID || '1QvLn7yJJ1c3xtwF8bd4lK_k6FL4hmcT5TiGvoeGRPow';
    
    const todayDate = getTodayDateKST();
    console.log(`📅 오늘 날짜 (한국시간): ${todayDate}\n`);
    
    // 문서 가져오기
    const document = await docs.documents.get({ documentId });
    let content = document.data.body.content;
    
    // 탭 형식 문서 처리
    if (document.data.tabs) {
      console.log('📑 탭 형식 문서입니다.');
      
      const tabs = document.data.tabs;
      let targetTab = null;
      
      for (const [tabId, tab] of Object.entries(tabs)) {
        if (tab.tabProperties && tab.tabProperties.title) {
          const tabTitle = tab.tabProperties.title;
          if (tabTitle.includes(todayDate) || tabTitle === todayDate) {
            targetTab = tab;
            console.log(`✅ ${todayDate} 탭을 찾았습니다!\n`);
            break;
          }
        }
      }
      
      if (!targetTab) {
        console.log(`❌ ${todayDate} 탭을 찾을 수 없습니다.`);
        return;
      }
      
      content = targetTab.documentTab.body.content;
    }
    
    // 파트 헤더가 있는 테이블 찾기
    let cameraPartFound = false;
    
    for (const element of content) {
      if (element.table) {
        const tableRows = element.table.tableRows;
        
        if (tableRows.length > 0) {
          const headerRow = tableRows[0];
          if (headerRow.tableCells && headerRow.tableCells.length > 0) {
            const firstHeaderCell = getTextFromTableCell(headerRow.tableCells[0]);
            
            if (firstHeaderCell.includes('파트') || firstHeaderCell.toLowerCase().includes('part')) {
              console.log('📊 파트 테이블을 찾았습니다!\n');
              
              // 카메라 파트 찾기
              const cameraLocation = findCameraPartRow(tableRows);
              
              if (cameraLocation) {
                // Firebase에서 실제 업무 데이터 가져오기
                let existingTasks = [];
                
                try {
                  // Firebase 데이터 가져오기 시도
                  const { FirebaseDataFetcher } = require('./src/services/firebaseDataFetcher');
                  const fetcher = new FirebaseDataFetcher();
                  const cameraTasks = await fetcher.fetchCameraTasks();
                  
                  if (cameraTasks && cameraTasks.length > 0) {
                    existingTasks = cameraTasks.map(task => task.title || task.name);
                    console.log(`📊 Firebase에서 ${existingTasks.length}개의 카메라 파트 업무를 가져왔습니다.`);
                  }
                } catch (error) {
                  console.log('⚠️  Firebase 연결 실패, 기본 업무 목록 사용');
                  // Firebase 실패 시 기본 업무 목록 사용
                  existingTasks = [
                    'AI 쇼츠 자동 제작 앱 개발',
                    '영상 편집 자동화 프로세스 구축',
                    '카메라 장비 점검 및 유지보수',
                    '클라이언트 촬영 일정 관리',
                    '신규 카메라 장비 테스트',
                    '편집 템플릿 제작',
                    '촬영 데이터 백업 시스템 구축'
                  ];
                }
                
                // 현재 테이블에서 기존 업무도 확인
                const currentTasks = [];
                for (let i = 1; i < tableRows.length; i++) {
                  const row = tableRows[i];
                  if (row.tableCells && row.tableCells.length > 1) {
                    const partCell = getTextFromTableCell(row.tableCells[0]);
                    const taskCell = getTextFromTableCell(row.tableCells[1]);
                    
                    if ((partCell.includes('카메라') || partCell.includes('Aiden')) && taskCell) {
                      currentTasks.push(taskCell);
                    }
                  }
                }
                
                if (currentTasks.length > 0) {
                  console.log(`📋 문서에서 ${currentTasks.length}개의 기존 업무를 찾았습니다.`);
                  existingTasks = [...new Set([...currentTasks, ...existingTasks])]; // 중복 제거
                }
                
                console.log('🤖 Gemini AI로 업무 분석 중...');
                const analyzedTasks = await analyzeTasksWithGemini(existingTasks);
                
                if (analyzedTasks && analyzedTasks.length > 0) {
                  console.log('\n📝 분석 결과:');
                  analyzedTasks.forEach((task, i) => {
                    console.log(`\n${i + 1}. ${task.task}`);
                    console.log(`   핵심 내용: ${task.content}`);
                    console.log(`   진행사항: ${task.progress}`);
                  });
                  
                  console.log('\n📄 Google Docs 업데이트 중...');
                  await updateGoogleDocs(docs, documentId, element, cameraLocation, analyzedTasks);
                  
                  cameraPartFound = true;
                  break;
                } else {
                  console.error('❌ AI 분석 실패');
                }
              } else {
                console.log('❌ 카메라 파트를 찾을 수 없습니다.');
              }
            }
          }
        }
      }
    }
    
    if (!cameraPartFound) {
      console.log('❌ 파트 테이블 또는 카메라 파트를 찾을 수 없습니다.');
    } else {
      console.log('\n✅ 모든 작업이 완료되었습니다!');
      console.log(`📄 문서 확인: https://docs.google.com/document/d/${documentId}/`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.response && error.response.data) {
      console.error('상세 오류:', error.response.data);
    }
  }
}

// 실행
analyzeCameraTasks();