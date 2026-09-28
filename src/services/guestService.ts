import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Guest, GuestFormData } from '../types/guest';
import { localStore } from './localStore';

export const guestService = {
  async getGuests(weddingId: string): Promise<Guest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_guests')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('full_name', { ascending: true });

        if (!error && data) {
          return data as Guest[];
        }
      } catch (err) {
        console.warn('Supabase fetch guests error, falling back to local storage:', err);
      }
    }

    return localStore.getGuests(weddingId);
  },

  async addGuest(weddingId: string, formData: GuestFormData): Promise<Guest> {
    const payload = {
      wedding_id: weddingId,
      full_name: formData.full_name.trim(),
      phone: formData.phone ? formData.phone.trim() : null,
      email: formData.email ? formData.email.trim() : null,
      family_group: formData.family_group || 'Relatives',
      wedding_side: formData.wedding_side || 'Both',
      accompanying_members: Number(formData.accompanying_members) || 0,
      adults_count: formData.adults_count !== undefined ? Number(formData.adults_count) : null,
      children_count: formData.children_count !== undefined ? Number(formData.children_count) : null,
      rsvp_status: formData.rsvp_status || 'Invited',
      food_preference: formData.food_preference || null,
      accommodation_required: Boolean(formData.accommodation_required),
      transport_required: Boolean(formData.transport_required),
      notes: formData.notes ? formData.notes.trim() : null,
      invited_events: formData.invited_events || [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_guests')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return data as Guest;
        }
      } catch (err) {
        console.warn('Supabase add guest error, using local fallback:', err);
      }
    }

    return localStore.addGuest(payload);
  },

  async updateGuest(guestId: string, formData: Partial<GuestFormData>): Promise<Guest | null> {
    const updates: Partial<Guest> = {};
    if (formData.full_name !== undefined) updates.full_name = formData.full_name.trim();
    if (formData.phone !== undefined) updates.phone = formData.phone ? formData.phone.trim() : null;
    if (formData.email !== undefined) updates.email = formData.email ? formData.email.trim() : null;
    if (formData.family_group !== undefined) updates.family_group = formData.family_group;
    if (formData.wedding_side !== undefined) updates.wedding_side = formData.wedding_side;
    if (formData.accompanying_members !== undefined)
      updates.accompanying_members = Number(formData.accompanying_members) || 0;
    if (formData.adults_count !== undefined)
      updates.adults_count = formData.adults_count !== null ? Number(formData.adults_count) : null;
    if (formData.children_count !== undefined)
      updates.children_count = formData.children_count !== null ? Number(formData.children_count) : null;
    if (formData.rsvp_status !== undefined) updates.rsvp_status = formData.rsvp_status;
    if (formData.food_preference !== undefined) updates.food_preference = formData.food_preference;
    if (formData.accommodation_required !== undefined)
      updates.accommodation_required = formData.accommodation_required;
    if (formData.transport_required !== undefined)
      updates.transport_required = formData.transport_required;
    if (formData.notes !== undefined) updates.notes = formData.notes ? formData.notes.trim() : null;
    if (formData.invited_events !== undefined) updates.invited_events = formData.invited_events;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_guests')
          .update(updates)
          .eq('id', guestId)
          .select()
          .single();

        if (!error && data) {
          return data as Guest;
        }
      } catch (err) {
        console.warn('Supabase update guest error, using local fallback:', err);
      }
    }

    return localStore.updateGuest(guestId, updates);
  },

  async deleteGuest(guestId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('wedding_guests').delete().eq('id', guestId);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete guest error, using local fallback:', err);
      }
    }

    return localStore.deleteGuest(guestId);
  },
};
