export interface OnboardingForm {
  email: string;
  password: string;
  name: string;
  role: "candidate" | "recruiter";
  country_id: number | null;

  // candidate
  profile_summary: string;
  skills: number[];
  job_category_id: number | null;

  // recruiter
  company_name: string;
  company_id: number | null;
  position_title: string;
}
