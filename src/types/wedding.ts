import { ExpenseCategory, Wedding } from './database.types';

export interface WeddingWithCategories extends Wedding {
  categories: ExpenseCategory[];
}

export interface WeddingSetupFormData {
  wedding_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  total_budget: number;
}
