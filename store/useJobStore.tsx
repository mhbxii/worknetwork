import type { Job, User, UserProfile } from "@/types/entities";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 10;

interface JobsState {
  jobs: Job[];
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  lastFetchKey: string | null;
  error: string | null;

  // Actions
  updateJobApplication: (jobId: number, applied: boolean) => void;
  updateJob: (jobId: number, updates: Partial<Job>) => void;
  fetchJobs: (
    user: User,
    profile: UserProfile,
    force?: boolean
  ) => Promise<void>;
  fetchMoreJobs: (user: User, profile: UserProfile) => Promise<void>;
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

function buildJobQuery(
  user: User,
  profile: UserProfile,
  page = 0,
  pageSize = PAGE_SIZE
) {
  let query = supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      description,
      created_at,
      status:status_id(id, name),
      company:company_id(id, name),
      category:job_category_id(id, name),
      skills:job_skills(
        skill:skill_id(id, name)
      ),
      job_applications(candidate_id)
    `
    )
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (user.role.name === "recruiter" && "company" in profile) {
    query = query.eq("company_id", profile.company?.id);
  } else if (user.role.name === "candidate" && "job_category" in profile) {
    query = query.eq("job_category_id", profile.job_category?.id);
    // For candidates, filter job_applications by their ID to get applied status
    query = query.or(`candidate_id.eq.${user.id},candidate_id.is.null`, {
      foreignTable: "job_applications",
    });
  }
  console.log(`Query range: ${page * pageSize} to ${(page + 1) * pageSize - 1}`);
  return query;
}

export const useJobStore = create<JobsState>((set, get) => ({
  jobs: [],
  loading: false,
  loadingMore: false,
  page: 0,
  hasMore: true,
  lastFetchKey: null,
  error: null,

  updateJobApplication: (jobId, applied) => {
    const currentState = get();
    const updatedJobs = currentState.jobs.map((job) =>
      job.id === jobId
        ? {
            ...job,
            applied: applied,
            nb_candidates: applied
              ? (job.nb_candidates || 0) + 1
              : Math.max((job.nb_candidates || 0) - 1, 0),
          }
        : job
    );
    set({ jobs: updatedJobs });
  },

  updateJob: (jobId, updates) => {
    const currentState = get();
    const updatedJobs = currentState.jobs.map((job) =>
      job.id === jobId ? { ...job, ...updates } : job
    );
    set({ jobs: updatedJobs });
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
    if (
      !force &&
      currentState.jobs.length > 0 &&
      currentState.lastFetchKey === fetchKey
    ) {
      console.log(
        "JobStore: Skipping duplicate fetch (has data) for",
        fetchKey
      );
      return;
    }

    console.log(
      "JobStore: Fetching jobs for",
      fetchKey,
      force ? "(forced)" : ""
    );

    try {
      set({
        loading: true,
        lastFetchKey: fetchKey,
        error: null,
        page: 0,
        hasMore: true,
      });

      const query = buildJobQuery(user, profile, 0, PAGE_SIZE);
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
        applied:
          user.role.name === "candidate"
            ? job.job_applications?.some(
                (app: any) => app.candidate_id === user.id
              ) || false
            : false,
        nb_candidates: job.job_applications?.length || 0,
      }));

      set({
        jobs: mappedJobs,
        loading: false,
        page: 1,
        hasMore: mappedJobs.length === PAGE_SIZE,
      });

      console.log("JobStore: Fetched", mappedJobs.length, "jobs");
    } catch (err: any) {
      console.error("JobStore: Error fetching jobs:", err);
      set({ jobs: [], loading: false, error: err.message, hasMore: false });
    }
  },

  fetchMoreJobs: async (user: User, profile: UserProfile) => {
    const currentState = get();
    const fetchKey = createFetchKey(user, profile);

    // Don't fetch if already loading, no more data, or different user/profile
    if (
      currentState.loadingMore ||
      !currentState.hasMore ||
      currentState.lastFetchKey !== fetchKey
    ) {
      return;
    }

    console.log("JobStore: Fetching more jobs, page", currentState.page);

    try {
      set({ loadingMore: true, error: null });

      const query = buildJobQuery(user, profile, currentState.page, PAGE_SIZE);
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
        applied:
          user.role.name === "candidate"
            ? job.job_applications?.some(
                (app: any) => app.candidate_id === user.id
              ) || false
            : false,
        nb_candidates: job.job_applications?.length || 0,
      }));

      set({
        jobs: [
          ...currentState.jobs,
          ...mappedJobs.filter(
            (newJob) =>
              !currentState.jobs.some(
                (existingJob) => existingJob.id === newJob.id
              )
          ),
        ],
        loadingMore: false,
        page: currentState.page + 1,
        hasMore: mappedJobs.length === PAGE_SIZE,
      });

      console.log("JobStore: Fetched", mappedJobs.length, "more jobs");
    } catch (err: any) {
      console.error("JobStore: Error fetching more jobs:", err);
      set({ loadingMore: false, error: err.message });
    }
  },

  reset: () => {
    console.log("JobStore: Reset");
    set({
      jobs: [],
      loading: false,
      loadingMore: false,
      page: 0,
      hasMore: true,
      lastFetchKey: null,
      error: null,
    });
  },
}));
