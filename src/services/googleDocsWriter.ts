import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { PrioritizedTask } from '../types';
import { config } from '../config';
import { getKoreanDateString } from '../utils/dateUtils';

export class GoogleDocsWriter {
  private auth: GoogleAuth;
  private docs: any;
  
  constructor() {
    const credentials = JSON.parse(config.google.serviceAccountKey);
    
    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/documents']
    });
    
    this.docs = google.docs({ version: 'v1', auth: this.auth });
  }
  
  async writeReport(tasks: PrioritizedTask[]): Promise<boolean> {
    try {
      const documentId = config.google.docId;
      const today = new Date();
      const dateString = getKoreanDateString(today);
      
      console.log(`Writing report for date: ${dateString}`);
      
      // Get document content
      const document = await this.docs.documents.get({ documentId });
      const content = document.data.body.content;
      
      // Find where to insert the report
      const insertIndex = await this.findInsertPosition(content, dateString);
      
      // Create the report text
      const reportText = this.createReportText(dateString, tasks);
      
      // Insert the report
      const requests = [{
        insertText: {
          location: { index: insertIndex },
          text: reportText
        }
      }];
      
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
  
  private async findInsertPosition(content: any[], dateString: string): Promise<number> {
    // Check if today's date section already exists
    let dateExists = false;
    let insertIndex = 1; // Default to start of document
    
    for (const element of content) {
      if (element.paragraph) {
        const text = element.paragraph.elements?.[0]?.textRun?.content || '';
        if (text.includes(dateString)) {
          dateExists = true;
          // Find the end of this date section
          insertIndex = element.endIndex || 1;
        }
      }
    }
    
    return insertIndex;
  }
  
  private createReportText(dateString: string, tasks: PrioritizedTask[]): string {
    let text = `\n\n=== ${dateString} 카메라 파트 업무 보고 ===\n\n`;
    text += `담당자: 카메라 Aiden Kim\n\n`;
    
    tasks.forEach((prioritizedTask, index) => {
      const { task, reasoning } = prioritizedTask;
      
      text += `${index + 1}. 진행 중인 업무 명칭: ${task.title}\n`;
      text += `   핵심 내용(방향성): ${reasoning || task.description || '업무 진행 중'}\n`;
      text += `   진행사항: ${task.progress}%\n\n`;
    });
    
    text += `보고 시간: ${new Date().toLocaleTimeString('ko-KR')}\n`;
    text += `─────────────────────────────────────\n`;
    
    return text;
  }
}