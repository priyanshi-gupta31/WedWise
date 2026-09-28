import { Expense, ExpenseCategory, PaymentMethod, PaymentStatus } from './database.types';

export interface ExpenseFormData {
  expense_name: string;
  amount: number;
  category_id: string;
  event_id?: string | null;
  vendor_id?: string | null;
  vendor_payment_id?: string | null;
  paid_by: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  expense_date: string;
  notes?: string;
}

export interface ExpenseFilterOptions {
  searchQuery?: string;
  category_id?: string;
  event_id?: string;
  vendor_id?: string;
  payment_status?: PaymentStatus | 'All';
  payment_method?: PaymentMethod | 'All';
  paid_by?: string;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export interface CategorySpendingSummary {
  category: ExpenseCategory;
  allocated: number;
  spent: number;
  pending: number;
  remaining: number;
  percentageUsed: number;
  expenseCount: number;
  status?: 'healthy' | 'watch' | 'critical' | 'over_budget';
}

