import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { PrioritizedTask } from '../types';
import { config } from '../config';

export class GoogleDocsWriter {
  private auth: GoogleAuth;
  private docs: any;
  
  constructor() {
    try {
      // 디버깅을 위한 로그 추가
      console.log('Google Service Account Key length:', config.google.serviceAccountKey?.length || 0);
      
      // JSON 파싱 전 검증
      if (!config.google.serviceAccountKey || config.google.serviceAccountKey === '{}') {
        console.warn('Google Service Account Key is not set or empty. Using default credentials.');
        this.auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/documents']
        });
      } else {
        // JSON 파싱 시도
        let credentials;
        try {
          credentials = JSON.parse(config.google.serviceAccountKey);
        } catch (parseError) {
          console.error('Failed to parse Google Service Account Key:', parseError);
          console.error('Invalid JSON (first 100 chars):', config.google.serviceAccountKey.substring(0, 100));
          throw new Error('Invalid Google Service Account Key format. Please check your GitHub Secrets configuration.');
        }
        
        this.auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/documents']
        });
      }
      
      this.docs = google.docs({ version: 'v1', auth: this.auth });
    } catch (error) {
      console.error('GoogleDocsWriter initialization error:', error);
      throw error;
    }
  }
  
  async writeReport(tasks: PrioritizedTask[]): Promise<boolean> {
    try {
      const documentId = config.google.docId;
      const today = new Date();
      const dateTabName = this.getDateTabName(today); // 예: "250804"
      
      console.log(`Looking for tab: ${dateTabName}`);
      
      // 문서 가져오기
      const document = await this.docs.documents.get({ documentId });
      
      // 날짜 탭 찾기
      const targetTab = await this.findDateTab(document.data, dateTabName);
      if (!targetTab) {
        console.error(`Tab '${dateTabName}' not found in document`);
        return false;
      }
      
      console.log(`Found tab '${dateTabName}'`);
      
      // 표에서 카메라 파트 위치 찾기
      const cameraLocation = await this.findCameraPartInTable(targetTab);
      if (!cameraLocation) {
        console.error('Camera part (카메라 Aiden Kim) not found in table');
        return false;
      }
      
      console.log('Found camera part location:', cameraLocation);
      
      // 배치 업데이트 요청 준비
      const requests = await this.prepareBatchUpdate(cameraLocation, tasks);
      
      // 문서 업데이트 실행
      await this.docs.documents.batchUpdate({
        documentId,
        resource: { requests }
      });
      
      console.log('Report written successfully to Google Docs');
      return true;
    } catch (error) {
      console.error('Error writing to Google Docs:', error);
      return false;
    }
  }
  
  private getDateTabName(date: Date): string {
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`; // 예: "250804"
  }
  
  private async findDateTab(document: any, tabName: string): Promise<any> {
    // Google Docs API v1은 탭을 직접 지원하지 않으므로
    // 문서 본문에서 날짜 섹션을 찾는 방식으로 구현
    const content = document.body.content;
    
    for (let i = 0; i < content.length; i++) {
      const element = content[i];
      if (element.paragraph) {
        const text = this.getTextFromElement(element);
        // 날짜 탭 형식을 찾기 (예: "=== 250804 ===" 또는 "### 250804")
        if (text.includes(tabName)) {
          return {
            startIndex: i,
            endIndex: this.findSectionEnd(content, i),
            content: content.slice(i, this.findSectionEnd(content, i))
          };
        }
      }
    }
    
    return null;
  }
  
  private findSectionEnd(content: any[], startIndex: number): number {
    // 다음 날짜 섹션이나 문서 끝까지를 현재 섹션으로 간주
    for (let i = startIndex + 1; i < content.length; i++) {
      const element = content[i];
      if (element.paragraph) {
        const text = this.getTextFromElement(element);
        // 다른 날짜 패턴 발견 시 현재 섹션 종료
        if (/\d{6}/.test(text) && text.includes('===')) {
          return i;
        }
      }
    }
    return content.length;
  }
  
  private async findCameraPartInTable(section: any): Promise<any> {
    const content = section.content;
    let tableFound = false;
    let cameraPartLocation = null;
    
    for (let i = 0; i < content.length; i++) {
      const element = content[i];
      
      // 표 찾기
      if (element.table) {
        console.log('Found table at index:', element.startIndex);
        
        // 표의 각 행 검사
        const tableRows = element.table.tableRows;
        for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
          const row = tableRows[rowIndex];
          
          // 첫 번째 셀 확인 (파트 정보가 있는 열)
          if (row.tableCells && row.tableCells.length > 0) {
            const firstCell = row.tableCells[0];
            const cellText = this.getTextFromTableCell(firstCell);
            
            console.log(`Row ${rowIndex}: ${cellText}`);
            
            // "카메라 Aiden Kim" 찾기
            if (cellText.includes('카메라') && cellText.includes('Aiden Kim')) {
              cameraPartLocation = {
                tableIndex: i,
                tableStartIndex: element.startIndex,
                rowIndex: rowIndex,
                row: row,
                cells: row.tableCells
              };
              console.log('Found camera part at row:', rowIndex);
              break;
            }
          }
        }
        
        if (cameraPartLocation) break;
      }
    }
    
    return cameraPartLocation;
  }
  
  private prepareBatchUpdate(location: any, tasks: PrioritizedTask[]): any[] {
    const requests: any[] = [];
    
    // 기존 데이터 삭제 (두 번째 셀부터 마지막 셀까지)
    if (location.cells.length > 1) {
      // 각 셀의 내용을 비우기
      for (let cellIndex = 1; cellIndex < location.cells.length; cellIndex++) {
        const cell = location.cells[cellIndex];
        if (cell.content && cell.content.length > 0) {
          const cellContent = cell.content[0];
          if (cellContent.paragraph && cellContent.endIndex && cellContent.startIndex) {
            requests.push({
              deleteContentRange: {
                range: {
                  startIndex: cellContent.startIndex + 1, // 텍스트 시작 위치
                  endIndex: cellContent.endIndex - 1 // 텍스트 끝 위치
                }
              }
            });
          }
        }
      }
    }
    
    // 새 데이터 삽입
    // 업무 정보를 표의 셀에 맞게 포맷
    const taskTexts = this.formatTasksForTable(tasks);
    
    // 각 셀에 새 텍스트 삽입
    taskTexts.forEach((text, index) => {
      if (location.cells[index + 1]) { // 첫 번째 셀은 파트 이름이므로 스킵
        const cell = location.cells[index + 1];
        if (cell.content && cell.content.length > 0) {
          const insertIndex = cell.content[0].startIndex + 1;
          requests.push({
            insertText: {
              location: { index: insertIndex },
              text: text
            }
          });
        }
      }
    });
    
    return requests;
  }
  
  private formatTasksForTable(tasks: PrioritizedTask[]): string[] {
    // 표의 열 구조에 맞게 데이터 포맷
    // 예상 열: [파트, 진행 중인 업무 명칭, 핵심 내용(방향성), 진행사항]
    const taskNames = tasks.map((pt, i) => `${i + 1}. ${pt.task.title}`).join('\n');
    const taskContents = tasks.map(pt => pt.reasoning || pt.task.description || '업무 진행 중').join('\n\n');
    const taskProgress = tasks.map(pt => `${pt.task.progress}%`).join('\n');
    
    return [taskNames, taskContents, taskProgress];
  }
  
  private getTextFromElement(element: any): string {
    if (element.paragraph && element.paragraph.elements) {
      return element.paragraph.elements
        .map((e: any) => e.textRun?.content || '')
        .join('');
    }
    return '';
  }
  
  private getTextFromTableCell(cell: any): string {
    if (cell.content) {
      return cell.content
        .map((element: any) => this.getTextFromElement(element))
        .join('');
    }
    return '';
  }
}