import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ------------------
// Role-specific data
// ------------------
export interface CandidateProject {
  name: string;
  description: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string;   // ISO yyyy-mm-dd
}

export interface CandidateExperience {
  company_id: number | null;
  company_name?: string; // used for search/autocomplete
  job_title: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string;   // ISO yyyy-mm-dd
}

export interface CandidateProfile {
  job_title: string;
  experiences: CandidateExperience[];
  projects: CandidateProject[];
  skills: number[];
  job_category_id: number | null;
}

export interface RecruiterProfile {
  company_name: string;
  company_id: number | null;
  position_title: string;
}

export type UserProfile =
  | { role: 'candidate'; data: CandidateProfile }
  | { role: 'recruiter'; data: RecruiterProfile }
  | { role: 'admin'; data: null };

// ------------------
// Base user (always loaded after login)
// ------------------
export interface User {
  id: number;
  supabase_user_id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  role_id: number; // keep your existing field for compatibility
  country_id: number;
  created_at: string;
  updated_at: string;
}

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
