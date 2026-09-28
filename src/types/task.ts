import { WeddingTask, TaskPriority, TaskStatus } from './database.types';

export interface TaskFormData {
  title: string;
  description?: string;
  event_id?: string | null;
  due_date?: string;
  assigned_to?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface GroupedTasks {
  today: WeddingTask[];
  thisWeek: WeddingTask[];
  upcoming: WeddingTask[];
  completed: WeddingTask[];
}
