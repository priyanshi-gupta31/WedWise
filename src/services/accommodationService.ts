import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { GuestAccommodation, AccommodationFormData } from '../types/guest';
import { localStore } from './localStore';

export const accommodationService = {
  async getAccommodations(weddingId: string): Promise<GuestAccommodation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_accommodations')
          .select('*, guest:wedding_guests(*)')
          .eq('wedding_id', weddingId)
          .order('check_in_date', { ascending: true });

        if (!error && data) {
          return data as GuestAccommodation[];
        }
      } catch (err) {
        console.warn('Supabase fetch accommodations error, using local fallback:', err);
      }
    }

    return localStore.getAccommodations(weddingId);
  },

  async addAccommodation(
    weddingId: string,
    formData: AccommodationFormData
  ): Promise<GuestAccommodation> {
    const payload = {
      wedding_id: weddingId,
      guest_id: formData.guest_id,
      hotel_name: formData.hotel_name.trim(),
      room_number: formData.room_number ? formData.room_number.trim() : null,
      room_type: formData.room_type ? formData.room_type.trim() : null,
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      occupants_count: Number(formData.occupants_count) || 1,
      payment_status: formData.payment_status || 'Paid',
      status: formData.status || 'Assigned',
      notes: formData.notes ? formData.notes.trim() : null,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_accommodations')
          .insert(payload)
          .select('*, guest:wedding_guests(*)')
          .single();

        if (!error && data) return data as GuestAccommodation;
      } catch (err) {
        console.warn('Supabase add accommodation error, using local fallback:', err);
      }
    }

    return localStore.addAccommodation(payload);
  },

  async updateAccommodation(
    id: string,
    formData: Partial<AccommodationFormData>
  ): Promise<GuestAccommodation | null> {
    const updates: Partial<GuestAccommodation> = {};
    if (formData.guest_id !== undefined) updates.guest_id = formData.guest_id;
    if (formData.hotel_name !== undefined) updates.hotel_name = formData.hotel_name.trim();
    if (formData.room_number !== undefined)
      updates.room_number = formData.room_number ? formData.room_number.trim() : null;
    if (formData.room_type !== undefined)
      updates.room_type = formData.room_type ? formData.room_type.trim() : null;
    if (formData.check_in_date !== undefined) updates.check_in_date = formData.check_in_date;
    if (formData.check_out_date !== undefined) updates.check_out_date = formData.check_out_date;
    if (formData.occupants_count !== undefined)
      updates.occupants_count = Number(formData.occupants_count) || 1;
    if (formData.payment_status !== undefined) updates.payment_status = formData.payment_status;
    if (formData.status !== undefined) updates.status = formData.status;
    if (formData.notes !== undefined)
      updates.notes = formData.notes ? formData.notes.trim() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_accommodations')
          .update(updates)
          .eq('id', id)
          .select('*, guest:wedding_guests(*)')
          .single();

        if (!error && data) return data as GuestAccommodation;
      } catch (err) {
        console.warn('Supabase update accommodation error, using local fallback:', err);
      }
    }

    return localStore.updateAccommodation(id, updates);
  },

  async deleteAccommodation(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('guest_accommodations').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete accommodation error, using local fallback:', err);
      }
    }

    return localStore.deleteAccommodation(id);
  },
};
