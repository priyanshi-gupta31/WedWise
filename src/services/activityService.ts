import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { WeddingActivity } from '../types/collaboration';
import { localStore } from './localStore';

export const activityService = {
  async getActivities(weddingId: string, limit: number = 50): Promise<WeddingActivity[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_activity')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data as WeddingActivity[];
        }
      } catch (err) {
        console.warn('Supabase fetch activity failed, falling back to local:', err);
      }
    }
    return localStore.getActivities(weddingId, limit);
  },

  async logActivity(
    activity: Omit<WeddingActivity, 'id' | 'created_at'>
  ): Promise<WeddingActivity> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_activity')
          .insert({
            wedding_id: activity.wedding_id,
            actor_user_id: activity.actor_user_id,
            actor_name: activity.actor_name,
            actor_role: activity.actor_role,
            action: activity.action,
            entity_type: activity.entity_type,
            entity_id: activity.entity_id,
            entity_title: activity.entity_title,
            metadata: activity.metadata || {},
          })
          .select()
          .single();

        if (!error && data) {
          return data as WeddingActivity;
        }
      } catch (err) {
        console.warn('Supabase log activity failed, recording locally:', err);
      }
    }
    return localStore.logActivity(activity);
  },
};
