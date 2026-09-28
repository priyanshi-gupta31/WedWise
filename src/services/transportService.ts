import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { GuestTransport, TransportFormData } from '../types/guest';
import { localStore } from './localStore';

export const transportService = {
  async getTransports(weddingId: string): Promise<GuestTransport[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_transports')
          .select('*, guest:wedding_guests(*)')
          .eq('wedding_id', weddingId)
          .order('date', { ascending: true });

        if (!error && data) {
          return data as GuestTransport[];
        }
      } catch (err) {
        console.warn('Supabase fetch transports error, using local fallback:', err);
      }
    }

    return localStore.getTransports(weddingId);
  },

  async addTransport(weddingId: string, formData: TransportFormData): Promise<GuestTransport> {
    const payload = {
      wedding_id: weddingId,
      guest_id: formData.guest_id,
      transport_type: formData.transport_type || 'Pickup',
      pickup_location: formData.pickup_location.trim(),
      destination: formData.destination.trim(),
      date: formData.date,
      time: formData.time,
      driver_name: formData.driver_name ? formData.driver_name.trim() : null,
      driver_phone: formData.driver_phone ? formData.driver_phone.trim() : null,
      vehicle_details: formData.vehicle_details ? formData.vehicle_details.trim() : null,
      status: formData.status || 'Planned',
      notes: formData.notes ? formData.notes.trim() : null,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_transports')
          .insert(payload)
          .select('*, guest:wedding_guests(*)')
          .single();

        if (!error && data) return data as GuestTransport;
      } catch (err) {
        console.warn('Supabase add transport error, using local fallback:', err);
      }
    }

    return localStore.addTransport(payload);
  },

  async updateTransport(
    id: string,
    formData: Partial<TransportFormData>
  ): Promise<GuestTransport | null> {
    const updates: Partial<GuestTransport> = {};
    if (formData.guest_id !== undefined) updates.guest_id = formData.guest_id;
    if (formData.transport_type !== undefined) updates.transport_type = formData.transport_type;
    if (formData.pickup_location !== undefined)
      updates.pickup_location = formData.pickup_location.trim();
    if (formData.destination !== undefined) updates.destination = formData.destination.trim();
    if (formData.date !== undefined) updates.date = formData.date;
    if (formData.time !== undefined) updates.time = formData.time;
    if (formData.driver_name !== undefined)
      updates.driver_name = formData.driver_name ? formData.driver_name.trim() : null;
    if (formData.driver_phone !== undefined)
      updates.driver_phone = formData.driver_phone ? formData.driver_phone.trim() : null;
    if (formData.vehicle_details !== undefined)
      updates.vehicle_details = formData.vehicle_details ? formData.vehicle_details.trim() : null;
    if (formData.status !== undefined) updates.status = formData.status;
    if (formData.notes !== undefined)
      updates.notes = formData.notes ? formData.notes.trim() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('guest_transports')
          .update(updates)
          .eq('id', id)
          .select('*, guest:wedding_guests(*)')
          .single();

        if (!error && data) return data as GuestTransport;
      } catch (err) {
        console.warn('Supabase update transport error, using local fallback:', err);
      }
    }

    return localStore.updateTransport(id, updates);
  },

  async deleteTransport(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('guest_transports').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete transport error, using local fallback:', err);
      }
    }

    return localStore.deleteTransport(id);
  },
};
