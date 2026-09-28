import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ExpenseCategory } from '../types/database.types';
import { localStore } from './localStore';
import { DEFAULT_CATEGORY_NAMES } from './sampleData';

export const categoryService = {
  async getCategories(weddingId: string): Promise<ExpenseCategory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }

        // If categories don't exist yet, seed default ones
        if (data && data.length === 0) {
          const toInsert = DEFAULT_CATEGORY_NAMES.map((cat) => ({
            wedding_id: weddingId,
            name: cat.name,
            icon: cat.icon,
            budget_limit: 0,
          }));
          const seeded = await supabase.from('expense_categories').insert(toInsert).select();
          if (seeded.data) return seeded.data;
        }
      } catch (err) {
        console.warn('Supabase fetch categories error:', err);
      }
    }

    return localStore.getCategories(weddingId);
  },

  async updateCategoryBudget(categoryId: string, newLimit: number): Promise<ExpenseCategory | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .update({ budget_limit: newLimit })
          .eq('id', categoryId)
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase update category budget error:', err);
      }
    }

    return localStore.updateCategoryBudget(categoryId, newLimit);
  },
};
