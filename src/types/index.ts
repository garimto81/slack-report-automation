export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  startDate?: Date;
  endDate?: Date;
  category?: string;
}

export interface CameraTask extends Task {
  assignee: 'Aiden Kim';
  category: 'camera';
}

export interface PrioritizedTask {
  task: Task;
  priorityScore: number;
  reasoning: string;
}

export interface ReportData {
  date: Date;
  tasks: PrioritizedTask[];
  totalTasks: number;
  cameraPartTasks: number;
}

export interface GoogleDocSection {
  date: string;
  part: string;
  taskName: string;
  description: string;
  progress: string;
}