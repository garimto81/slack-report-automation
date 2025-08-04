import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Task } from '../types';

// Use the same Firebase config as the website
const firebaseConfig = {
  apiKey: "AIzaSyD6LVOtT0x30CQNZDt5aSUEBKT8vXPhM6k",
  authDomain: "ggp-camera.firebaseapp.com",
  projectId: "ggp-camera",
  storageBucket: "ggp-camera.appspot.com",
  messagingSenderId: "906682771595",
  appId: "1:906682771595:web:431b539435f4a0ca294c8e",
  measurementId: "G-JLR9TMLSS1"
};

export class FirebaseDataFetcher {
  private db: any;
  private auth: any;
  
  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }
  
  async initialize(): Promise<void> {
    try {
      await signInAnonymously(this.auth);
      console.log('Authenticated with Firebase anonymously');
    } catch (error) {
      console.error('Firebase authentication error:', error);
    }
  }
  
  async fetchCameraTasks(): Promise<Task[]> {
    try {
      // Ensure authentication before fetching
      await this.initialize();
      
      console.log('Fetching tasks from Firebase...');
      
      // Fetch all tasks from Firebase
      const tasksCollection = collection(this.db, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      
      const allTasks: Task[] = [];
      
      tasksSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if task is assigned to Aiden Kim (camera part)
        if (data.assignees && Array.isArray(data.assignees)) {
          const isAidenTask = data.assignees.some((assignee: any) => {
            // Handle both string and object assignee formats
            if (typeof assignee === 'string') {
              return assignee === 'Aiden Kim';
            } else if (assignee && typeof assignee === 'object') {
              return assignee.name === 'Aiden Kim';
            }
            return false;
          });
          
          if (isAidenTask) {
            const task: Task = {
              id: doc.id,
              title: data.title || 'Untitled Task',
              description: data.url || data.description || '',
              assignee: 'Aiden Kim',
              progress: this.calculateProgress(data),
              status: this.determineStatus(data),
              priority: this.determinePriority(data),
              startDate: data.startDate?.toDate ? data.startDate.toDate() : 
                        data.startDate?.seconds ? new Date(data.startDate.seconds * 1000) : undefined,
              endDate: data.endDate?.toDate ? data.endDate.toDate() : 
                      data.endDate?.seconds ? new Date(data.endDate.seconds * 1000) : undefined,
              category: data.category || 'camera'
            };
            
            allTasks.push(task);
          }
        }
      });
      
      console.log(`Found ${allTasks.length} camera tasks in Firebase`);
      return allTasks;
    } catch (error) {
      console.error('Error fetching from Firebase:', error);
      return [];
    }
  }
  
  private calculateProgress(data: any): number {
    if (data.progress !== undefined) {
      return data.progress;
    }
    
    if (data.status === 'completed') {
      return 100;
    } else if (data.status === 'in-progress') {
      return 50;
    }
    
    return 0;
  }
  
  private determineStatus(data: any): 'pending' | 'in-progress' | 'completed' {
    if (data.status) {
      const status = data.status.toLowerCase();
      if (status === 'completed' || status === 'done') {
        return 'completed';
      } else if (status === 'in-progress' || status === 'active' || status === '진행중') {
        return 'in-progress';
      }
    }
    
    return 'pending';
  }
  
  private determinePriority(data: any): 'high' | 'medium' | 'low' {
    if (data.priority && typeof data.priority === 'string') {
      const priority = data.priority.toLowerCase();
      if (priority === 'high' || priority === '높음') return 'high';
      if (priority === 'low' || priority === '낮음') return 'low';
    }
    
    // Default priority based on status
    if (data.status === 'urgent' || data.status === '긴급') return 'high';
    
    return 'medium';
  }
}