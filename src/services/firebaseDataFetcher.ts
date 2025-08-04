import { initializeApp, getApps, getApp } from 'firebase/app';
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
  private static instance: FirebaseDataFetcher;
  private static isInitialized = false;
  private static cachedTasks: { data: Task[], timestamp: number } | null = null;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시
  
  private db: any;
  private auth: any;
  
  constructor() {
    // Firebase 앱이 이미 초기화되었는지 확인
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }
  
  static getInstance(): FirebaseDataFetcher {
    if (!FirebaseDataFetcher.instance) {
      FirebaseDataFetcher.instance = new FirebaseDataFetcher();
    }
    return FirebaseDataFetcher.instance;
  }
  
  async initialize(): Promise<void> {
    if (FirebaseDataFetcher.isInitialized) {
      return; // 이미 인증됨
    }
    
    try {
      const startTime = Date.now();
      await signInAnonymously(this.auth);
      FirebaseDataFetcher.isInitialized = true;
      console.log(`Firebase auth completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Firebase authentication error:', error);
    }
  }
  
  async fetchCameraTasks(): Promise<Task[]> {
    try {
      // 캐시 확인
      if (FirebaseDataFetcher.cachedTasks && 
          Date.now() - FirebaseDataFetcher.cachedTasks.timestamp < FirebaseDataFetcher.CACHE_DURATION) {
        console.log('Using cached Firebase data');
        return FirebaseDataFetcher.cachedTasks.data;
      }
      
      // Ensure authentication before fetching
      await this.initialize();
      
      const startTime = Date.now();
      console.log('Fetching tasks from Firebase...');
      
      // Fetch only Aiden Kim's tasks
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
      
      console.log(`Firebase fetch completed in ${Date.now() - startTime}ms`);
      console.log(`Found ${allTasks.length} camera tasks in Firebase`);
      
      // 캐시 저장
      FirebaseDataFetcher.cachedTasks = {
        data: allTasks,
        timestamp: Date.now()
      };
      
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