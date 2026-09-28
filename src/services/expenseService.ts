import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Expense, ExpenseCategory } from '../types/database.types';
import { CategorySpendingSummary, ExpenseFormData } from '../types/expense';
import { localStore } from './localStore';

import { getCategoryBudgetStatus } from '../utils/budgetIntelligence';

const syncingExpenseIds = new Set<string>();

export const expenseService = {
  async getExpenses(weddingId: string): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*, category:expense_categories(*), event:wedding_events(*)')
          .eq('wedding_id', weddingId)
          .order('expense_date', { ascending: false });

        if (!error && data) {
          // Check for any local unsynced expenses (created while offline or during previous PGRST error)
          try {
            const local = localStore.getExpenses(weddingId);
            const unsynced = local.filter((l) => l.id.startsWith('exp-'));
            if (unsynced.length > 0) {
              for (const item of unsynced) {
                // Mutex: skip if another in-flight call is already syncing this specific local expense
                if (syncingExpenseIds.has(item.id)) continue;

                // Idempotency check: verify if an expense with identical key attributes already exists in Supabase
                const alreadyInSupabase = data.some((dbExp) => {
                  const sameName = (dbExp.expense_name || '').trim().toLowerCase() === (item.expense_name || '').trim().toLowerCase();
                  const sameAmount = Math.abs(Number(dbExp.amount || 0) - Number(item.amount || 0)) < 0.01;
                  const sameCat = (dbExp.category_id || null) === (item.category_id || null);
                  const sameDate = (dbExp.expense_date || '') === (item.expense_date || '');
                  const sameStatus = (dbExp.payment_status || 'Paid') === (item.payment_status || 'Paid');
                  return sameName && sameAmount && sameCat && sameDate && sameStatus;
                });

                if (alreadyInSupabase) {
                  // Already present in Supabase Postgres: delete local draft without re-inserting
                  localStore.deleteExpense(item.id);
                  continue;
                }

                syncingExpenseIds.add(item.id);
                try {
                  const { data: inserted, error: insErr } = await supabase
                    .from('expenses')
                    .insert({
                      wedding_id: weddingId,
                      category_id: item.category_id || null,
                      event_id: item.event_id || null,
                      expense_name: item.expense_name,
                      amount: item.amount,
                      paid_by: item.paid_by,
                      payment_method: item.payment_method,
                      payment_status: item.payment_status,
                      expense_date: item.expense_date,
                      notes: item.notes || null,
                      created_by: item.created_by || null,
                    })
                    .select('*, category:expense_categories(*), event:wedding_events(*)')
                    .single();

                  if (!insErr && inserted) {
                    data.unshift(inserted as Expense);
                    localStore.deleteExpense(item.id);
                  }
                } finally {
                  syncingExpenseIds.delete(item.id);
                }
              }
            }
          } catch (syncErr) {
            console.warn('Auto-sync unsynced local expenses error:', syncErr);
          }

          return data as Expense[];
        }
      } catch (err) {
        console.warn('Supabase fetch expenses error:', err);
      }
    }

    return localStore.getExpenses(weddingId);
  },

  async addExpense(
    weddingId: string,
    userId: string,
    formData: ExpenseFormData
  ): Promise<Expense> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert({
            wedding_id: weddingId,
            category_id: formData.category_id || null,
            event_id: formData.event_id || null,
            expense_name: formData.expense_name.trim(),
            amount: Number(formData.amount),
            paid_by: formData.paid_by.trim(),
            payment_method: formData.payment_method,
            payment_status: formData.payment_status,
            expense_date: formData.expense_date,
            notes: formData.notes ? formData.notes.trim() : null,
            created_by: userId,
          })
          .select('*, category:expense_categories(*), event:wedding_events(*)')
          .single();

        if (error) throw error;
        return data as Expense;
      } catch (err) {
        console.warn('Supabase add expense error, using local fallback:', err);
      }
    }

    return localStore.addExpense({
      wedding_id: weddingId,
      category_id: formData.category_id || null,
      event_id: formData.event_id || null,
      expense_name: formData.expense_name.trim(),
      amount: Number(formData.amount),
      paid_by: formData.paid_by.trim(),
      payment_method: formData.payment_method,
      payment_status: formData.payment_status,
      expense_date: formData.expense_date,
      notes: formData.notes ? formData.notes.trim() : null,
      created_by: userId,
    });
  },

  async updateExpense(
    expenseId: string,
    formData: Partial<ExpenseFormData>
  ): Promise<Expense | null> {
    const updates: Partial<Expense> = {};
    if (formData.expense_name !== undefined) updates.expense_name = formData.expense_name.trim();
    if (formData.amount !== undefined) updates.amount = Number(formData.amount);
    if (formData.category_id !== undefined) updates.category_id = formData.category_id || null;
    if (formData.event_id !== undefined) updates.event_id = formData.event_id || null;
    if (formData.paid_by !== undefined) updates.paid_by = formData.paid_by.trim();
    if (formData.payment_method !== undefined) updates.payment_method = formData.payment_method;
    if (formData.payment_status !== undefined) updates.payment_status = formData.payment_status;
    if (formData.expense_date !== undefined) updates.expense_date = formData.expense_date;
    if (formData.notes !== undefined) updates.notes = formData.notes ? formData.notes.trim() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update(updates)
          .eq('id', expenseId)
          .select('*, category:expense_categories(*), event:wedding_events(*)')
          .single();

        if (!error && data) return data as Expense;
      } catch (err) {
        console.warn('Supabase update expense error:', err);
      }
    }

    return localStore.updateExpense(expenseId, updates);
  },

  async deleteExpense(expenseId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete expense error:', err);
      }
    }

    return localStore.deleteExpense(expenseId);
  },

  /**
   * Dynamically aggregates spending and category statistics from raw expenses
   */
  calculateCategorySummaries(
    categories: ExpenseCategory[],
    expenses: Expense[]
  ): CategorySpendingSummary[] {
    return categories.map((cat) => {
      // Find all expenses in this category
      const catExpenses = expenses.filter((e) => e.category_id === cat.id);
      const spent = catExpenses
        .filter((e) => e.payment_status === 'Paid')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const pending = catExpenses
        .filter((e) => e.payment_status === 'Pending')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const allocated = Number(cat.budget_limit) || 0;
      const remaining = allocated > 0 ? allocated - spent : 0;
      const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
      const statusInfo = getCategoryBudgetStatus(spent, allocated);

      return {
        category: cat,
        allocated,
        spent,
        pending,
        remaining,
        percentageUsed,
        expenseCount: catExpenses.length,
        status: statusInfo.status,
      };
    });
  },
};

