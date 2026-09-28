import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ExpenseCategory, Wedding } from '../types/database.types';
import { WeddingSetupFormData } from '../types/wedding';
import { localStore } from './localStore';
import { DEFAULT_CATEGORY_NAMES } from './sampleData';

export const weddingService = {
  async getActiveWedding(userId: string): Promise<Wedding | null> {
    if (isSupabaseConfigured && supabase) {
      if (userId.startsWith('local-')) {
        return localStore.getActiveWedding(userId);
      }
      try {
        const { data, error } = await supabase
          .from('weddings')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return data;
        }

        // Check if user is an accepted member of any wedding
        const { data: memberData } = await supabase
          .from('wedding_members')
          .select('wedding_id')
          .eq('user_id', userId)
          .eq('status', 'Accepted')
          .limit(1)
          .maybeSingle();

        if (memberData?.wedding_id) {
          const { data: memberWedding } = await supabase
            .from('weddings')
            .select('*')
            .eq('id', memberData.wedding_id)
            .maybeSingle();
          if (memberWedding) return memberWedding;
        }
      } catch (err) {
        console.warn('Supabase fetch active wedding failed, falling back to local storage:', err);
      }
    }
    return localStore.getActiveWedding(userId);
  },

  async createWedding(
    userId: string,
    formData: WeddingSetupFormData
  ): Promise<{ wedding: Wedding; categories: ExpenseCategory[] }> {
    if (isSupabaseConfigured && supabase && !userId.startsWith('local-')) {
      try {
        // 1. Insert wedding in Supabase
        const { data: wedding, error: wedError } = await supabase
          .from('weddings')
          .insert({
            owner_id: userId,
            wedding_name: formData.wedding_name,
            bride_name: formData.bride_name,
            groom_name: formData.groom_name,
            wedding_date: formData.wedding_date,
            total_budget: formData.total_budget,
          })
          .select()
          .single();

        if (wedError) throw wedError;

        // 2. Resolve user email to ensure not-null constraint on wedding_members is satisfied
        const { data: userData } = await supabase.auth.getUser();
        const userEmail = userData?.user?.email || 'owner@wedwise.app';
        const displayName = `${formData.bride_name} & ${formData.groom_name}`;

        // 3. Register creator as OWNER in wedding_members table idempotently
        // The database trigger `tr_new_wedding_owner` already creates the owner row upon wedding insertion.
        // We perform an idempotent upsert on conflict (wedding_id, user_id) to ensure display_name and email are cleanly populated.
        const { error: memberError } = await supabase
          .from('wedding_members')
          .upsert(
            {
              wedding_id: wedding.id,
              user_id: userId,
              role: 'OWNER',
              display_name: displayName,
              email: userEmail,
              status: 'Accepted',
            },
            { onConflict: 'wedding_id,user_id' }
          );

        if (memberError) {
          console.warn('Non-fatal error updating wedding owner membership:', memberError.message);
        }

        // 4. Fetch categories (the Supabase trigger automatically seeds the 14 categories)
        // If trigger is not installed yet, seed explicitly
        let { data: categories, error: catError } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('wedding_id', wedding.id);

        if (catError || !categories || categories.length === 0) {
          const toInsert = DEFAULT_CATEGORY_NAMES.map((cat) => ({
            wedding_id: wedding.id,
            name: cat.name,
            icon: cat.icon,
            budget_limit: 0,
          }));

          const res = await supabase.from('expense_categories').insert(toInsert).select();
          categories = res.data || [];
        }

        return { wedding, categories: categories || [] };
      } catch (err) {
        console.warn('Supabase wedding creation error, storing locally:', err);
      }
    }

    return localStore.createWedding(userId, formData);
  },

  async updateWedding(weddingId: string, updates: Partial<Wedding>): Promise<Wedding | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('weddings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', weddingId)
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase update wedding error:', err);
      }
    }

    return localStore.updateWedding(weddingId, updates);
  },

  async loadSampleWedding(userId: string) {
    if (isSupabaseConfigured && supabase) {
      try {
        const sample = localStore.loadSampleData(userId);
        // Also insert into Supabase if connected
        const { data: wed } = await supabase.from('weddings').insert({
          owner_id: userId,
          wedding_name: sample.wedding.wedding_name,
          bride_name: sample.wedding.bride_name,
          groom_name: sample.wedding.groom_name,
          wedding_date: sample.wedding.wedding_date,
          total_budget: sample.wedding.total_budget,
        }).select().single();

        if (wed) {
          // fetch or insert categories & expenses
          const { data: cats } = await supabase.from('expense_categories').select('*').eq('wedding_id', wed.id);
          const activeCats = cats || [];
          for (const exp of sample.expenses) {
            const matchedCat = activeCats.find(c => c.name === exp.category?.name);
            await supabase.from('expenses').insert({
              wedding_id: wed.id,
              category_id: matchedCat ? matchedCat.id : null,
              expense_name: exp.expense_name,
              amount: exp.amount,
              paid_by: exp.paid_by,
              payment_method: exp.payment_method,
              payment_status: exp.payment_status,
              expense_date: exp.expense_date,
              notes: exp.notes,
              created_by: userId,
            });
          }
        }
        return sample;
      } catch (e) {
        console.warn('Supabase sample load fallback:', e);
      }
    }
    return localStore.loadSampleData(userId);
  }
};
