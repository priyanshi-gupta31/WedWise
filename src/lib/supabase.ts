import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check environment variables first, then check local storage override
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('wedwise_supabase_url') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('wedwise_supabase_key') || '' : '';

export const supabaseUrl = envUrl || localUrl;
export const supabaseAnonKey = envAnonKey || localKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey.length > 20
);

let client: SupabaseClient<any> | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const supabase = client;

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wedwise_supabase_url', url.trim());
    localStorage.setItem('wedwise_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wedwise_supabase_url');
    localStorage.removeItem('wedwise_supabase_key');
    window.location.reload();
  }
}
