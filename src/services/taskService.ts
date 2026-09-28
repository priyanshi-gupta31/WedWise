import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { WeddingTask } from '../types/database.types';
import { TaskFormData } from '../types/task';
import { localStore } from './localStore';

export const taskService = {
  async getTasks(weddingId: string): Promise<WeddingTask[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_tasks')
          .select('*, event:wedding_events(*)')
          .eq('wedding_id', weddingId)
          .order('due_date', { ascending: true });

        if (!error && data) {
          return data as WeddingTask[];
        }
      } catch (err) {
        console.warn('Supabase fetch tasks error, using local fallback:', err);
      }
    }

    return localStore.getTasks(weddingId);
  },

  async addTask(weddingId: string, formData: TaskFormData): Promise<WeddingTask> {
    const payload = {
      wedding_id: weddingId,
      event_id: formData.event_id || null,
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : null,
      due_date: formData.due_date || null,
      assigned_to: formData.assigned_to ? formData.assigned_to.trim() : null,
      priority: formData.priority || 'Normal',
      status: formData.status || 'Todo',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_tasks')
          .insert(payload)
          .select('*, event:wedding_events(*)')
          .single();

        if (!error && data) return data as WeddingTask;
      } catch (err) {
        console.warn('Supabase add task error, using local fallback:', err);
      }
    }

    return localStore.addTask(payload);
  },

  async updateTask(taskId: string, formData: Partial<TaskFormData>): Promise<WeddingTask | null> {
    const updates: Partial<WeddingTask> = {};
    if (formData.title !== undefined) updates.title = formData.title.trim();
    if (formData.description !== undefined)
      updates.description = formData.description ? formData.description.trim() : null;
    if (formData.event_id !== undefined) updates.event_id = formData.event_id || null;
    if (formData.due_date !== undefined) updates.due_date = formData.due_date || null;
    if (formData.assigned_to !== undefined)
      updates.assigned_to = formData.assigned_to ? formData.assigned_to.trim() : null;
    if (formData.priority !== undefined) updates.priority = formData.priority;
    if (formData.status !== undefined) updates.status = formData.status;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_tasks')
          .update(updates)
          .eq('id', taskId)
          .select('*, event:wedding_events(*)')
          .single();

        if (!error && data) return data as WeddingTask;
      } catch (err) {
        console.warn('Supabase update task error, using local fallback:', err);
      }
    }

    return localStore.updateTask(taskId, updates);
  },

  async deleteTask(taskId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('wedding_tasks').delete().eq('id', taskId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete task error, using local fallback:', err);
      }
    }

    return localStore.deleteTask(taskId);
  },

  async toggleTask(taskId: string, currentStatus?: string): Promise<WeddingTask | null> {
    const nextStatus = currentStatus === 'Completed' ? 'Todo' : 'Completed';
    return this.updateTask(taskId, { status: nextStatus });
  },
};
