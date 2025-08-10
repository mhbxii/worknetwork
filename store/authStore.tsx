import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserProfile } from '../types/entities';


// ------------------
// Store state
// ------------------
interface AuthState {
  session: any | null;          // Supabase session
  user: User | null;            // Base user row
  profile: UserProfile | null;  // Role-specific profile data
  initialized: boolean;

  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitialized: (value: boolean) => void;
  signOut: () => Promise<void>;
  clearAuth: () => void;
}

// ------------------
// Zustand store
// ------------------
export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (value) => set({ initialized: value }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  clearAuth: () => set({ session: null, user: null, profile: null }),
}));
