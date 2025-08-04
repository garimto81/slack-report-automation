import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { PrioritizedTask } from '../types';
import { config } from '../config';

export class GoogleDocsWriterV2 {
  private auth: GoogleAuth;
  private docs: any;
  
  constructor() {
    try {
      console.log('Initializing GoogleDocsWriterV2...');
      
      if (!config.google.serviceAccountKey || config.google.serviceAccountKey === '{}') {
        console.warn('Google Service Account Key is not set. Using default credentials.');
        this.auth = new GoogleAuth({
          scopes: [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive.readonly'
          ]
        });
      } else {
        let credentials;
        try {
          credentials = JSON.parse(config.google.serviceAccountKey);
        } catch (parseError) {
          console.error('Failed to parse Google Service Account Key');
          throw new Error('Invalid Google Service Account Key format');
        }
        
        this.auth = new GoogleAuth({
          credentials,
          scopes: [
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/drive.readonly'
          ]
        });
      }
      
      // v2 API 사용
      this.docs = google.docs({ version: 'v1', auth: this.auth });
    } catch (error) {
      console.error('GoogleDocsWriterV2 initialization error:', error);
      throw error;
    }
  }
  
  async writeReport(tasks: PrioritizedTask[]): Promise<boolean> {
    try {
      const documentId = config.google.docId;
      const today = new Date();
      const dateTabName = this.getDateTabName(today); // 예: "250804"
      
      console.log(`\n🔍 Looking for date: ${dateTabName}`);
      console.log(`📄 Document ID: ${documentId}`);
      
      // 문서 구조 분석을 위한 디버그 모드
      const debugMode = true;
      
      // 문서 가져오기
      console.log('📥 Fetching document...');
      const document = await this.docs.documents.get({ 
        documentId,
        suggestionsViewMode: 'PREVIEW_WITHOUT_SUGGESTIONS'
      });
      
      if (debugMode) {
        console.log('\n📊 Document structure analysis:');
        this.analyzeDocumentStructure(document.data);
      }
      
      // 먼저 전체 문서에서 표 찾기
      const allTables = this.findAllTables(document.data);
      console.log(`📋 Found ${allTables.length} tables in document`);
      
      // 각 표에서 카메라 파트 찾기
      let cameraLocation = null;
      let tableInfo = null;
      
      for (const table of allTables) {
        console.log(`\n🔍 Checking table at index ${table.index} (${table.rows} rows x ${table.columns} columns)`);
        const location = await this.findCameraPartInTable(document.data, table);
        if (location) {
          cameraLocation = location;
          tableInfo = table;
          break;
        }
      }
      
      if (!cameraLocation) {
        console.error('❌ Camera part (카메라 Aiden Kim) not found in any table');
        console.log('💡 Tip: Make sure there is a table with "카메라 Aiden Kim" in the first column');
        
        // 날짜 섹션 방식도 시도
        console.log('\n🔄 Trying date section approach...');
        const tabInfo = await this.findDateSection(document.data, dateTabName);
        if (tabInfo) {
          console.log(`Found date section at index ${tabInfo.startIndex}`);
          const sectionTable = await this.findTableInSection(document.data, tabInfo);
          if (sectionTable) {
            cameraLocation = await this.findCameraPartInTable(document.data, sectionTable);
            if (cameraLocation) {
              console.log('✅ Found camera part using date section approach');
            }
          }
        }
        
        if (!cameraLocation) {
          return false;
        }
      }
      
      console.log(`✅ Found camera part at row ${cameraLocation.rowIndex}`);
      
      // 배치 업데이트 준비
      const requests = this.prepareBatchUpdate(cameraLocation, tasks);
      console.log(`📝 Prepared ${requests.length} update requests`);
      
      // 문서 업데이트 실행
      if (requests.length > 0) {
        console.log('📤 Sending batch update...');
        await this.docs.documents.batchUpdate({
          documentId,
          resource: { requests }
        });
        
        console.log('✅ Report written successfully to Google Docs!');
      } else {
        console.log('⚠️ No updates to make');
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Error writing to Google Docs:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }
  
  private getDateTabName(date: Date): string {
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
  
  private analyzeDocumentStructure(document: any): void {
    const content = document.body.content;
    let tableCount = 0;
    let paragraphCount = 0;
    
    console.log(`Total elements: ${content.length}`);
    
    for (let i = 0; i < Math.min(content.length, 20); i++) {
      const element = content[i];
      if (element.paragraph) {
        paragraphCount++;
        const text = this.getTextFromElement(element);
        if (text.trim()) {
          console.log(`[${i}] Paragraph: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        }
      } else if (element.table) {
        tableCount++;
        console.log(`[${i}] Table: ${element.table.rows} rows x ${element.table.columns} columns`);
      }
    }
    
    console.log(`\nSummary: ${paragraphCount} paragraphs, ${tableCount} tables`);
  }
  
  private findAllTables(document: any): any[] {
    const content = document.body.content;
    const tables: any[] = [];
    
    for (let i = 0; i < content.length; i++) {
      const element = content[i];
      if (element.table) {
        tables.push({
          index: i,
          startIndex: element.startIndex,
          endIndex: element.endIndex,
          rows: element.table.rows,
          columns: element.table.columns,
          tableElement: element.table
        });
      }
    }
    
    return tables;
  }
  
  private async findDateSection(document: any, dateTabName: string): Promise<any> {
    const content = document.body.content;
    
    // 다양한 날짜 형식 패턴
    const patterns = [
      dateTabName,                                    // 250804
      `${dateTabName.slice(0,2)}.${dateTabName.slice(2,4)}.${dateTabName.slice(4)}`, // 25.08.04
      `20${dateTabName.slice(0,2)}.${dateTabName.slice(2,4)}.${dateTabName.slice(4)}`, // 2025.08.04
      `${dateTabName.slice(2,4)}/${dateTabName.slice(4)}`, // 08/04
      `${dateTabName.slice(2,4)}.${dateTabName.slice(4)}`, // 08.04
    ];
    
    console.log('🔍 Searching for date patterns:', patterns);
    
    for (let i = 0; i < content.length; i++) {
      const element = content[i];
      if (element.paragraph) {
        const text = this.getTextFromElement(element);
        
        for (const pattern of patterns) {
          if (text.includes(pattern)) {
            console.log(`✅ Found date pattern "${pattern}" in: "${text}"`);
            return {
              startIndex: i,
              endIndex: this.findSectionEnd(content, i),
              pattern: pattern
            };
          }
        }
      }
    }
    
    return null;
  }
  
  private findSectionEnd(content: any[], startIndex: number): number {
    // 다음 날짜 패턴이나 문서 끝까지
    for (let i = startIndex + 1; i < content.length; i++) {
      const element = content[i];
      if (element.paragraph) {
        const text = this.getTextFromElement(element);
        // 다른 날짜 패턴 발견 시 현재 섹션 종료
        if (/\d{2}[\.\-\/]\d{2}[\.\-\/]\d{2}|\d{6}/.test(text)) {
          return i;
        }
      }
    }
    return content.length;
  }
  
  private async findTableInSection(document: any, sectionInfo: any): Promise<any> {
    const content = document.body.content;
    
    for (let i = sectionInfo.startIndex; i < sectionInfo.endIndex; i++) {
      const element = content[i];
      if (element.table) {
        return {
          index: i,
          startIndex: element.startIndex,
          endIndex: element.endIndex,
          rows: element.table.rows,
          columns: element.table.columns,
          tableElement: element.table
        };
      }
    }
    
    return null;
  }
  
  private async findCameraPartInTable(document: any, tableInfo: any): Promise<any> {
    const table = tableInfo.tableElement;
    const tableRows = table.tableRows;
    
    console.log(`\n🔍 Searching for camera part in ${tableRows.length} rows...`);
    
    // 먼저 "카메라" 행을 찾기
    let cameraRowIndex = -1;
    
    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex++) {
      const row = tableRows[rowIndex];
      
      if (row.tableCells && row.tableCells.length > 0) {
        const firstCell = row.tableCells[0];
        const cellText = this.getTextFromTableCell(firstCell);
        
        console.log(`Row ${rowIndex}: "${cellText.trim()}"`);
        
        // "카메라" 텍스트를 찾으면
        if (cellText.trim() === '카메라' || cellText.includes('카메라')) {
          console.log(`✅ Found '카메라' at row ${rowIndex}`);
          cameraRowIndex = rowIndex;
          
          // 다음 행들을 확인하여 Aiden Kim 찾기
          for (let nextRow = rowIndex + 1; nextRow < Math.min(rowIndex + 5, tableRows.length); nextRow++) {
            const checkRow = tableRows[nextRow];
            if (checkRow.tableCells && checkRow.tableCells.length > 0) {
              const nextCellText = this.getTextFromTableCell(checkRow.tableCells[0]);
              console.log(`  Checking row ${nextRow}: "${nextCellText.trim()}"`);
              
              if (nextCellText.includes('Aiden') || nextCellText.includes('에이든')) {
                console.log(`✅ Found Aiden Kim at row ${nextRow}`);
                return {
                  tableIndex: tableInfo.index,
                  rowIndex: nextRow,
                  row: checkRow,
                  cells: checkRow.tableCells,
                  cellIndexes: this.getCellIndexes(checkRow.tableCells)
                };
              }
              
              // 빈 행이 아니고 다른 파트가 시작되면 중단
              if (nextCellText.trim() && !nextCellText.includes('Aiden') && !nextCellText.includes('에이든')) {
                break;
              }
            }
          }
          
          // Aiden Kim을 찾지 못했지만 카메라 행은 찾았으므로
          // 카메라 행 다음의 첫 번째 빈 행을 사용
          for (let nextRow = rowIndex + 1; nextRow < Math.min(rowIndex + 5, tableRows.length); nextRow++) {
            const checkRow = tableRows[nextRow];
            if (checkRow.tableCells && checkRow.tableCells.length > 0) {
              const nextCellText = this.getTextFromTableCell(checkRow.tableCells[0]);
              
              // 빈 행을 찾으면
              if (!nextCellText.trim()) {
                console.log(`✅ Using empty row ${nextRow} for camera part`);
                return {
                  tableIndex: tableInfo.index,
                  rowIndex: nextRow,
                  row: checkRow,
                  cells: checkRow.tableCells,
                  cellIndexes: this.getCellIndexes(checkRow.tableCells),
                  isEmptyRow: true
                };
              }
            }
          }
        }
        
        // 기존 로직도 유지 (카메라 Aiden Kim이 한 셀에 있는 경우)
        if ((cellText.includes('카메라') && cellText.includes('Aiden')) ||
            (cellText.includes('Camera') && cellText.includes('Aiden')) ||
            cellText.includes('카메라 Aiden Kim')) {
          
          console.log(`✅ Found camera part at row ${rowIndex}`);
          
          return {
            tableIndex: tableInfo.index,
            rowIndex: rowIndex,
            row: row,
            cells: row.tableCells,
            cellIndexes: this.getCellIndexes(row.tableCells)
          };
        }
      }
    }
    
    return null;
  }
  
  private getCellIndexes(cells: any[]): number[] {
    const indexes: number[] = [];
    for (const cell of cells) {
      if (cell.content && cell.content.length > 0) {
        indexes.push(cell.content[0].startIndex);
      }
    }
    return indexes;
  }
  
  private prepareBatchUpdate(location: any, tasks: PrioritizedTask[]): any[] {
    const requests: any[] = [];
    
    // 빈 행인 경우 첫 번째 셀에 "Aiden Kim" 추가
    if (location.isEmptyRow && location.cells.length > 0) {
      const firstCell = location.cells[0];
      if (firstCell.content && firstCell.content.length > 0) {
        requests.push({
          insertText: {
            location: { index: firstCell.content[0].startIndex + 1 },
            text: "Aiden Kim"
          }
        });
      }
    }
    
    // 기존 데이터 삭제 (두 번째 셀부터)
    for (let cellIndex = 1; cellIndex < location.cells.length && cellIndex < 4; cellIndex++) {
      const cell = location.cells[cellIndex];
      if (cell.content && cell.content.length > 0) {
        // 각 content element 처리
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
    
    // requests를 역순으로 정렬 (높은 인덱스부터 삭제)
    requests.sort((a, b) => {
      const aIndex = a.deleteContentRange?.range?.startIndex || 0;
      const bIndex = b.deleteContentRange?.range?.startIndex || 0;
      return bIndex - aIndex;
    });
    
    // 새 데이터 삽입 요청 추가
    const insertRequests = this.prepareInsertRequests(location, tasks);
    
    return [...requests, ...insertRequests];
  }
  
  private prepareInsertRequests(location: any, tasks: PrioritizedTask[]): any[] {
    const requests: any[] = [];
    const taskTexts = this.formatTasksForTable(tasks);
    
    // 각 셀에 텍스트 삽입 (cellIndexes 사용)
    for (let i = 0; i < taskTexts.length && i < 3; i++) {
      const cellIndex = i + 1; // 첫 번째 셀은 파트 이름
      if (location.cellIndexes[cellIndex]) {
        requests.push({
          insertText: {
            location: { index: location.cellIndexes[cellIndex] },
            text: taskTexts[i]
          }
        });
      }
    }
    
    return requests;
  }
  
  private formatTasksForTable(tasks: PrioritizedTask[]): string[] {
    // 표의 열 구조에 맞게 데이터 포맷
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
        .join(' ');
    }
    return '';
  }
}