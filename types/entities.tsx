export type MetaOption = { id: number; name: string };

// Extended interface for recruiters fetched from database
export interface FetchedRecruiter extends RecruiterProfile {
  user_id: number;
}

export interface Message {
  id: number;
  sender: MetaOption;
  receiver: MetaOption;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string; // e.g., "1-2" (smaller_id-larger_id)
  participants: MetaOption[]; // [user1, user2]
  last_message: Message;
  unread_count: number;
  updated_at: string; // from last message
}

export interface Notification {
  id: number;
  target_user_id: number;
  type: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Proposal {
  id: number;
  user: User;
  candidate: CandidateProfile | null; // null if not candidate
  job_id: number; // from jobs.id
  status: MetaOption;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  matched_score: number | null;
  viewed: boolean | null;
}

export type Job = {
  id: number; // from jobs.id
  title: string;
  description: string | null;
  status: MetaOption; // from status.name
  created_at: string; // parse to Date in client if needed
  skills?: MetaOption[]; // aggregated skills
  company: MetaOption;
  category: MetaOption;
  applied: boolean | null;
  nb_candidates: number | null;
};

// ------------------
// Role-specific data
// ------------------
export interface CandidateProject {
  name: string;
  description: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string; // ISO yyyy-mm-dd
}

export interface CandidateExperience {
  company: MetaOption | null;
  job_title: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string; // ISO yyyy-mm-dd
}

export interface CandidateProfile {
  job_title: string;
  experiences: CandidateExperience[];
  projects: CandidateProject[];
  skills: MetaOption[] | null;
  job_category: MetaOption | null;
  nb_proposals: number | null;
}

export interface RecruiterProfile {
  company: MetaOption | null;
  position_title: string;
}

export type UserProfile = CandidateProfile | RecruiterProfile;

// ------------------
// Base user (always loaded after login)
// ------------------
export interface User {
  id: number;
  supabase_user_id: string;
  name: string;
  email: string;
  profile_pic_url?: string;
  role: MetaOption; // keep your existing field for compatibility
  country: MetaOption;
  created_at: string;
  updated_at: string;
}

export interface OnboardingForm {
  email: string;
  password: string;
  name: string;
  role: MetaOption; // "candidate" or "recruiter"
  country: MetaOption | null;

  // candidate fields
  job_title: string; // extracted from CV
  experiences: CandidateExperience[]; // 0..*
  projects: CandidateProject[]; // 0..5
  skills: MetaOption[] | null;
  job_category: MetaOption | null;

  // recruiter fields
  company: MetaOption | null;
  position_title: string;
}

export function updateProfile<T extends UserProfile>(
  prevProfile: T | null,
  updater: (profile: T) => T
): T | null {
  if (!prevProfile) return prevProfile;
  return updater(prevProfile);
}

export function isCandidateProfile(p: UserProfile | null): p is CandidateProfile {
  return !!p && "nb_proposals" in p;
}