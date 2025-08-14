import type { Job, User, UserProfile } from "@/types/entities";
import { create } from 'zustand';
import { supabase } from "../lib/supabase";

interface JobsState {
  jobs: Job[];
  loading: boolean;
  lastFetchKey: string | null; // To prevent duplicate fetches
  
  // Actions
  setJobsAndLoading: (jobs: Job[], loading: boolean) => void;
  setLoading: (loading: boolean) => void;
  fetchJobs: (user: User, profile: UserProfile, force?: boolean) => Promise<void>;
  reset: () => void;
}

// Helper to create a unique fetch key
function createFetchKey(user: User, profile: UserProfile): string {
  if (user.role.name === "recruiter" && "company" in profile) {
    return `recruiter_${profile.company?.id}`;
  } else if (user.role.name === "candidate" && "job_category" in profile) {
    return `candidate_${profile.job_category?.id}`;
  }
  return `${user.role.name}_${user.id}`;
}

export const useJobStore = create<JobsState>((set, get) => ({
  jobs: [],
  loading: false,
  lastFetchKey: null,

  setJobsAndLoading: (jobs, loading) => {
    set({ jobs, loading });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  fetchJobs: async (user: User, profile: UserProfile, force = false) => {
    const fetchKey = createFetchKey(user, profile);
    const currentState = get();
    
    // Prevent duplicate fetches for the same user/profile combo
    if (currentState.loading && currentState.lastFetchKey === fetchKey) {
      console.log("JobStore: Skipping duplicate fetch (loading) for", fetchKey);
      return;
    }

    // Skip if we already have data for this key and it's not a forced refresh
    if (!force && currentState.jobs.length > 0 && currentState.lastFetchKey === fetchKey) {
      console.log("JobStore: Skipping duplicate fetch (has data) for", fetchKey);
      return;
    }

    console.log("JobStore: Fetching jobs for", fetchKey, force ? "(forced)" : "");
    
    try {
      // Single state update to start loading
      set({ loading: true, lastFetchKey: fetchKey });
      
      const query = buildJobQuery(user, profile);
      const { data, error } = await query;

      if (error) throw error;

      const mappedJobs = (data ?? []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        created_at: job.created_at,
        status: job.status,
        company: job.company,
        category: job.category,
        skills: (job.skills || []).map((s: any) => s.skill),
      }));

      // Single state update with both jobs and loading
      set({ jobs: mappedJobs, loading: false });
      console.log("JobStore: Fetched", mappedJobs.length, "jobs");
      
    } catch (err) {
      console.error("JobStore: Error fetching jobs:", err);
      // Single state update for error case
      set({ jobs: [], loading: false });
    }
  },

  reset: () => {
    set({ jobs: [], loading: false, lastFetchKey: null });
  },
}));

function buildJobQuery(user: User, profile: UserProfile, page = 0, pageSize = 20) {
  let query = supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      status:status_id(id, name),
      company:company_id(id, name),
      category:job_category_id(id, name),
      skills:job_skills(
        skill:skill_id(id, name)
      )
    `)
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (user.role.name === "recruiter" && "company" in profile) {
    query = query.eq("company_id", profile.company?.id);
  } else if (user.role.name === "candidate" && "job_category" in profile) {
    query = query.eq("job_category_id", profile.job_category?.id);
  }

  return query;
}