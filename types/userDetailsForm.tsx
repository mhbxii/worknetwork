export interface CandidateProject {
  name: string;
  description: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string;   // ISO yyyy-mm-dd
}

export interface CandidateExperience {
  company_id: number | null;
  company_name: string; // used for search/autocomplete
  job_title: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string;   // ISO yyyy-mm-dd
}

export interface OnboardingForm {
  email: string;
  password: string;
  name: string;
  role: "candidate" | "recruiter";
  country_id: number | null;

  // candidate fields
  job_title: string; // extracted from CV
  experiences: CandidateExperience[]; // 0..*
  projects: CandidateProject[]; // 0..5
  skills: number[]; // IDs from DB
  job_category_id: number | null;

  // recruiter fields
  company_name: string;
  company_id: number | null;
  position_title: string;
}
