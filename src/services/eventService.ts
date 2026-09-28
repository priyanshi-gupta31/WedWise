import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { WeddingEvent } from '../types/database.types';
import { EventFormData } from '../types/event';
import { localStore } from './localStore';

export const eventService = {
  async getEvents(weddingId: string): Promise<WeddingEvent[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_events')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('date', { ascending: true });

        if (!error && data) {
          return data as WeddingEvent[];
        }
      } catch (err) {
        console.warn('Supabase fetch events error, using local fallback:', err);
      }
    }

    return localStore.getEvents(weddingId);
  },

  async addEvent(weddingId: string, formData: EventFormData): Promise<WeddingEvent> {
    const payload = {
      wedding_id: weddingId,
      event_name: formData.event_name.trim(),
      event_type: formData.event_type,
      date: formData.date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      venue: formData.venue ? formData.venue.trim() : null,
      description: formData.description ? formData.description.trim() : null,
      expected_guests: formData.expected_guests ? Number(formData.expected_guests) : null,
      budget_allocation: formData.budget_allocation ? Number(formData.budget_allocation) : 0,
      status: formData.status || 'Upcoming',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_events')
          .insert(payload)
          .select()
          .single();

        if (!error && data) return data as WeddingEvent;
      } catch (err) {
        console.warn('Supabase add event error, using local fallback:', err);
      }
    }

    return localStore.addEvent(payload);
  },

  async updateEvent(
    eventId: string,
    formData: Partial<EventFormData>
  ): Promise<WeddingEvent | null> {
    const updates: Partial<WeddingEvent> = {};
    if (formData.event_name !== undefined) updates.event_name = formData.event_name.trim();
    if (formData.event_type !== undefined) updates.event_type = formData.event_type;
    if (formData.date !== undefined) updates.date = formData.date;
    if (formData.start_time !== undefined) updates.start_time = formData.start_time || null;
    if (formData.end_time !== undefined) updates.end_time = formData.end_time || null;
    if (formData.venue !== undefined) updates.venue = formData.venue ? formData.venue.trim() : null;
    if (formData.description !== undefined)
      updates.description = formData.description ? formData.description.trim() : null;
    if (formData.expected_guests !== undefined)
      updates.expected_guests = formData.expected_guests ? Number(formData.expected_guests) : null;
    if (formData.budget_allocation !== undefined)
      updates.budget_allocation = formData.budget_allocation ? Number(formData.budget_allocation) : 0;
    if (formData.status !== undefined) updates.status = formData.status;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_events')
          .update(updates)
          .eq('id', eventId)
          .select()
          .single();

        if (!error && data) return data as WeddingEvent;
      } catch (err) {
        console.warn('Supabase update event error, using local fallback:', err);
      }
    }

    return localStore.updateEvent(eventId, updates);
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('wedding_events').delete().eq('id', eventId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete event error, using local fallback:', err);
      }
    }

    return localStore.deleteEvent(eventId);
  },
};
