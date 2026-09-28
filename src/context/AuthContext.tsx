import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Profile } from '../types/database.types';
import { localStore } from '../services/localStore';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isSupabaseActive: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  enterDemoMode: () => Promise<void>;
}

const safeSession = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {
      // Safe fallback for restricted storage environments
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Safe fallback for restricted storage environments
    }
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      // 1. In production or whenever Supabase is configured, check for active Supabase session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user) {
            const u = session.user;
            setUser({ id: u.id, email: u.email || '', user_metadata: u.user_metadata });
            
            // Fetch profile
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', u.id)
              .maybeSingle();

            if (prof) {
              setProfile(prof);
            } else {
              setProfile({
                id: u.id,
                email: u.email || '',
                full_name: u.user_metadata?.full_name || 'Wedding Planner',
                created_at: new Date().toISOString(),
              });
            }
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase auth session error:', err);
        }
      }

      // 2. Check if the user is in an EXPLICIT, active Demo Mode session
      // (explicitly triggered via enterDemoMode within this browsing session)
      const isExplicitDemo = safeSession.getItem('wedwise_demo_mode') === 'true';
      if (isExplicitDemo) {
        const localProf = localStore.getProfile();
        if (localProf && localProf.id.startsWith('local-')) {
          setProfile(localProf);
          setUser({
            id: localProf.id,
            email: localProf.email,
            user_metadata: { full_name: localProf.full_name },
          });
          setIsLoading(false);
          return;
        }
      }

      // 3. Otherwise: Clean up any stale local demo profile left from past browser visits,
      // and ensure a fresh user sees the real authentication screen.
      const staleProf = localStore.getProfile();
      if (staleProf && staleProf.id.startsWith('local-')) {
        localStore.setProfile(null);
      }
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({ id: u.id, email: u.email || '', user_metadata: u.user_metadata });
          const { data: prof } = await client
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();

          if (prof) setProfile(prof);
        } else {
          // If session is cleared, do NOT resurrect demo mode unless explicitly in active demo
          const isExplicitDemo = safeSession.getItem('wedwise_demo_mode') === 'true';
          const localProf = localStore.getProfile();
          if (isExplicitDemo && localProf && localProf.id.startsWith('local-')) {
            setUser({ id: localProf.id, email: localProf.email, user_metadata: { full_name: localProf.full_name } });
            setProfile(localProf);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!email || !password) {
      return { error: 'Please enter both email and password.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        safeSession.removeItem('wedwise_demo_mode');
        localStore.setProfile(null);
        const u = data.user;
        setUser({ id: u.id, email: u.email || '', user_metadata: u.user_metadata });

        // Immediately fetch and populate user's profile
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();

          if (prof) {
            setProfile(prof);
          } else {
            const fallbackProf: Profile = {
              id: u.id,
              email: u.email || '',
              full_name: u.user_metadata?.full_name || 'Wedding Planner',
              created_at: new Date().toISOString(),
            };
            setProfile(fallbackProf);
            await supabase.from('profiles').upsert(fallbackProf);
          }
        } catch (profErr) {
          console.warn('Error fetching profile on login:', profErr);
        }
      }
      return { error: null };
    }

    // Local demo login
    const localProf = localStore.getProfile();
    if (localProf && localProf.email.toLowerCase() === email.toLowerCase().trim()) {
      safeSession.setItem('wedwise_demo_mode', 'true');
      setUser({ id: localProf.id, email: localProf.email, user_metadata: { full_name: localProf.full_name } });
      setProfile(localProf);
      return { error: null };
    }

    // Allow login directly with any credentials in demo mode if no profile existed
    const demoProf: Profile = {
      id: 'local-user-id',
      email: email.trim(),
      full_name: 'Wedding Family',
      created_at: new Date().toISOString(),
    };
    localStore.setProfile(demoProf);
    safeSession.setItem('wedwise_demo_mode', 'true');
    setProfile(demoProf);
    setUser({ id: demoProf.id, email: demoProf.email, user_metadata: { full_name: demoProf.full_name } });
    return { error: null };
  };

  const enterDemoMode = async (): Promise<void> => {
    // 1. If a remote Supabase session exists, safely sign out so it is not mixed
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    // 2. Set up demo profile in local store and load sample data
    const demoProf: Profile = {
      id: 'local-demo-user',
      email: 'priya@wedwise.family',
      full_name: 'Priya Sharma',
      created_at: new Date().toISOString(),
    };
    localStore.setProfile(demoProf);
    localStore.loadSampleData(demoProf.id);

    // 3. Mark demo mode active for current session
    safeSession.setItem('wedwise_demo_mode', 'true');

    // 4. Set local client state
    setProfile(demoProf);
    setUser({
      id: demoProf.id,
      email: demoProf.email,
      user_metadata: { full_name: demoProf.full_name },
    });
  };

  const signUp = async (fullName: string, email: string, password: string): Promise<{ error: string | null }> => {
    if (!fullName.trim()) return { error: 'Please enter your full name.' };
    if (!email.trim() || !email.includes('@')) return { error: 'Please enter a valid email address.' };
    if (password.length < 6) return { error: 'Password must be at least 6 characters long.' };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        safeSession.removeItem('wedwise_demo_mode');
        localStore.setProfile(null);
        // If email confirmation is disabled, user is immediately active
        const newProf: Profile = {
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          created_at: new Date().toISOString(),
        };
        setUser({ id: data.user.id, email: email.trim(), user_metadata: { full_name: fullName.trim() } });
        setProfile(newProf);

        // Attempt insert profile
        await supabase.from('profiles').upsert(newProf);
      }
      return { error: null };
    }

    // Local demo signup
    const newProf: Profile = {
      id: 'usr-' + Date.now(),
      full_name: fullName.trim(),
      email: email.trim(),
      created_at: new Date().toISOString(),
    };
    localStore.setProfile(newProf);
    safeSession.setItem('wedwise_demo_mode', 'true');
    setProfile(newProf);
    setUser({ id: newProf.id, email: newProf.email, user_metadata: { full_name: newProf.full_name } });

    return { error: null };
  };

  const signOut = async () => {
    safeSession.removeItem('wedwise_demo_mode');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStore.setProfile(null);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!email || !email.includes('@')) return { error: 'Please enter a valid email address.' };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { error: error.message };
      return { error: null };
    }

    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
