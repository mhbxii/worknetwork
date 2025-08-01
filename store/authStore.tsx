import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface User {
  id: number;
  supabase_user_id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  role_id: number;
  country_id: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  session: any | null;        // Supabase session
  user: User | null;
  initialized: boolean;          // Row from public.users
  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  setInitialized: (value: boolean) => void;
  signOut: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setInitialized: (value) => set({ initialized: value }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },

  clearAuth: () => set({ session: null, user: null }),
}));
