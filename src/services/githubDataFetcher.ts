import axios from 'axios';
import { Task } from '../types';
import { config } from '../config';

export class GitHubDataFetcher {
  private readonly repoOwner = 'garimto81';
  private readonly repoName = 'ggp-report';
  
  async fetchRecentActivities(): Promise<Partial<Task>[]> {
    try {
      console.log('Attempting to fetch GitHub activities...');
      
      const [issues, commits] = await Promise.all([
        this.fetchIssues().catch(err => {
          console.warn('Failed to fetch issues:', err.message);
          return [];
        }),
        this.fetchRecentCommits().catch(err => {
          console.warn('Failed to fetch commits:', err.message);
          return [];
        })
      ]);
      
      const tasks: Partial<Task>[] = [];
      
      issues.forEach((issue: any) => {
        if (issue.assignee?.login === 'garimto81' || 
            issue.labels.some((l: any) => l.name.toLowerCase().includes('camera'))) {
          tasks.push({
            title: issue.title,
            description: issue.body,
            status: issue.state === 'open' ? 'in-progress' : 'completed',
            category: 'camera'
          });
        }
      });
      
      commits.forEach((commit: any) => {
        if (commit.commit.message.toLowerCase().includes('camera')) {
          tasks.push({
            title: `Commit: ${commit.commit.message.split('\n')[0]}`,
            description: commit.commit.message,
            status: 'completed',
            category: 'camera'
          });
        }
      });
      
      return tasks;
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      return [];
    }
  }
  
  private async fetchIssues() {
    const response = await axios.get(
      `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/issues`,
      { params: { state: 'all', per_page: 30 } }
    );
    return response.data;
  }
  
  private async fetchRecentCommits() {
    const response = await axios.get(
      `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/commits`,
      { params: { per_page: 30 } }
    );
    return response.data;
  }
}