export type Job = {
  id: number; // from jobs.id
  title: string;
  description: string | null;
  status: string; // from status.name
  created_at: string; // parse to Date in client if needed
  skills?: string[]; // aggregated skills
  company_name: string;
  category_name: string;
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
  company_id: number | null;
  company_name?: string; // used for search/autocomplete
  job_title: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string; // ISO yyyy-mm-dd
}

export interface CandidateProfile {
  job_title: string;
  experiences: CandidateExperience[];
  projects: CandidateProject[];
  skills: number[];
  job_category_id: number | null;
  nb_proposals: number | null;
}

export interface RecruiterProfile {
  company_name: string;
  company_id: number | null;
  position_title: string;
}

export type UserProfile =
  | { role: "candidate"; data: CandidateProfile }
  | { role: "recruiter"; data: RecruiterProfile }
  | { role: "admin"; data: null };

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
