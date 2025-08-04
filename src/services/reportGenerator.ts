import { FirebaseDataFetcher } from './firebaseDataFetcher';
import { GitHubDataFetcher } from './githubDataFetcher';
import { GeminiAnalyzer } from './geminiAnalyzer';
import { GoogleDocsWriter } from './googleDocsWriter';
import { Task } from '../types';

export class ReportGenerator {
  private firebaseFetcher: FirebaseDataFetcher;
  private githubFetcher: GitHubDataFetcher;
  private geminiAnalyzer: GeminiAnalyzer;
  private docsWriter: GoogleDocsWriter;
  
  constructor() {
    this.firebaseFetcher = new FirebaseDataFetcher();
    this.githubFetcher = new GitHubDataFetcher();
    this.geminiAnalyzer = new GeminiAnalyzer();
    this.docsWriter = new GoogleDocsWriter();
  }
  
  async generateReport(): Promise<boolean> {
    try {
      console.log('Starting report generation...');
      
      console.log('1. Fetching tasks from Firebase...');
      const firebaseTasks = await this.firebaseFetcher.fetchCameraTasks();
      
      console.log('2. Fetching tasks from GitHub...');
      const githubTasks = await this.githubFetcher.fetchRecentActivities();
      
      if (githubTasks.length === 0) {
        console.log('No GitHub tasks found (repository may not exist or be private)');
      }
      
      const allTasks = this.mergeTasks(firebaseTasks, githubTasks);
      console.log(`Found ${allTasks.length} total camera tasks`);
      
      if (allTasks.length === 0) {
        console.log('No camera tasks found');
        return false;
      }
      
      console.log('3. Analyzing task priorities with Gemini AI...');
      const prioritizedTasks = await this.geminiAnalyzer.prioritizeTasks(allTasks);
      
      console.log('4. Writing report to Google Docs...');
      const success = await this.docsWriter.writeReport(prioritizedTasks);
      
      if (success) {
        console.log('Report generated successfully!');
      } else {
        console.log('Failed to generate report');
      }
      
      return success;
    } catch (error) {
      console.error('Error generating report:', error);
      return false;
    }
  }
  
  private mergeTasks(firebaseTasks: Task[], githubTasks: Partial<Task>[]): Task[] {
    const tasks: Task[] = [...firebaseTasks];
    let idCounter = tasks.length;
    
    githubTasks.forEach((partialTask) => {
      const task: Task = {
        id: `github-${idCounter++}`,
        title: partialTask.title || 'Untitled',
        description: partialTask.description,
        assignee: 'Aiden Kim',
        progress: partialTask.status === 'completed' ? 100 : 50,
        status: partialTask.status || 'in-progress',
        category: 'camera'
      };
      tasks.push(task);
    });
    
    return tasks;
  }
}