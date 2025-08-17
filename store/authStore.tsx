import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, UserProfile } from '../types/entities';

// ------------------ 
// Store state
// ------------------ 
interface AuthState {
  session: any | null;
  user: User | null;
  profile: UserProfile | null;
  initialized: boolean;
  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitialized: (value: boolean) => void;
  signOut: () => Promise<void>;
}

// Helper function to check if profiles are deeply equal
function profilesEqual(a: UserProfile | null, b: UserProfile | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  // Compare based on profile type
  if ('company' in a && 'company' in b) {
    // Recruiter profile
    return (
      a.company?.id === b.company?.id &&
      a.company?.name === b.company?.name &&
      a.position_title === b.position_title
    );
  }

  if ('job_category' in a && 'job_category' in b) {
    // Candidate profile
    return (
      a.job_title === b.job_title &&
      a.job_category?.id === b.job_category?.id &&
      a.job_category?.name === b.job_category?.name &&
      a.nb_proposals === b.nb_proposals &&
      JSON.stringify(a.projects) === JSON.stringify(b.projects) &&
      JSON.stringify(a.experiences) === JSON.stringify(b.experiences) &&
      JSON.stringify(a.skills) === JSON.stringify(b.skills)
    );
  }

  return false;
}

// ------------------ 
// Zustand store
// ------------------ 
export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,

  setSession: (session) => {
    const currentSession = get().session;
    if (currentSession !== session) {
      set({ session });
    }
  },

  setUser: (user) => {
    const currentUser = get().user;
    // Only update if user actually changed
    if (currentUser?.id !== user?.id || currentUser?.name !== user?.name) {
      console.log("Auth Store: User updated", user?.name);
      set({ user });
    }
  },

  setProfile: (profile) => {
    const currentProfile = get().profile;
    
    // Only update if profile actually changed
    if (!profilesEqual(currentProfile, profile)) {
      console.log("Auth Store: Profile updated", profile);
      set({ profile });
    } else {
      console.log("Auth Store: Profile unchanged, skipping update");
    }
  },

  setInitialized: (value) => {
    const current = get().initialized;
    if (current !== value) {
      console.log("Auth Store: Initialized set to", value);
      set({ initialized: value });
    }
  },

  signOut: async () => {
    set({ session: null, user: null, profile: null });
    await supabase.auth.signOut();
    //router.replace('/OnboardingFlow');
  },
}));