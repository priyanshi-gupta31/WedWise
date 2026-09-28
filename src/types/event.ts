import { WeddingEvent, WeddingEventType, EventStatus } from './database.types';

export const DEFAULT_EVENT_TYPES: WeddingEventType[] = [
  'Engagement',
  'Haldi',
  'Mehendi',
  'Sangeet',
  'Wedding',
  'Reception',
];

export interface EventFormData {
  event_name: string;
  event_type: WeddingEventType | string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  description?: string;
  expected_guests?: number;
  budget_allocation?: number;
  status?: EventStatus;
}

export interface EventSpendingSummary {
  event: WeddingEvent;
  allocated: number;
  allocatedBudget?: number;
  spent: number;
  pending?: number;
  remaining: number;
  percentageUsed: number;
  expenseCount: number;
  taskCount?: number;
  completedTaskCount?: number;
}
