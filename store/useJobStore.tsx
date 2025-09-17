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

  // Search state
  searchTerm: string;
  isSearching: boolean;

  // Actions
  updateJobApplication: (jobId: number, applied: boolean) => void;
  updateJob: (jobId: number, updates: Partial<Job>) => void;
  fetchJobs: (
    user: User,
    profile: UserProfile,
    force?: boolean
  ) => Promise<void>;
  fetchMoreJobs: (user: User, profile: UserProfile) => Promise<void>;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  reset: () => void;
}

// Helper to create a unique fetch key
function createFetchKey(
  user: User,
  profile: UserProfile,
  searchTerm?: string
): string {
  const baseKey =
    user.role.name === "recruiter" && "company" in profile
      ? `recruiter_${profile.company?.id}`
      : user.role.name === "candidate" && "job_category" in profile
      ? `candidate_${profile.job_category?.id}`
      : `${user.role.name}_${user.id}`;

  return searchTerm ? `${baseKey}_search_${searchTerm}` : baseKey;
}

function buildJobQuery(
  user: User,
  profile: UserProfile,
  page = 0,
  pageSize = PAGE_SIZE,
  searchTerm?: string
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
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Base role filtering
  if (user.role.name === "recruiter" && "company" in profile) {
    query = query.eq("company_id", profile.company?.id);
  } else if (user.role.name === "candidate" && "job_category" in profile) {
    query = query.eq("job_category_id", profile.job_category?.id);
    // For candidates, filter job_applications by their ID to get applied status
    query = query.or(`candidate_id.eq.${user.id},candidate_id.is.null`, {
      foreignTable: "job_applications",
    });
  }

  // Search filtering and ordering
  if (searchTerm && searchTerm.length >= 2) {
    const searchPattern = `%${searchTerm}%`;

    // Add search conditions
    query = query.or(
      `title.ilike.${searchPattern},description.ilike.${searchPattern}`
    );

    // Order by relevance using CASE WHEN, then by created_at
    query = query.order("created_at", { ascending: false }); // We'll handle relevance in post-processing
  } else {
    // Default ordering
    query = query.order("created_at", { ascending: false });
  }

  console.log(
    `Query range: ${page * pageSize} to ${(page + 1) * pageSize - 1}`,
    searchTerm ? `Search: "${searchTerm}"` : ""
  );
  return query;
}

// Function to calculate relevance score and sort results
function sortJobsByRelevance(jobs: Job[], searchTerm: string): Job[] {
  if (!searchTerm || searchTerm.length < 2) return jobs;

  const term = searchTerm.toLowerCase();

  return jobs
    .map((job) => {
      let score = 0;

      // Title match (priority 4)
      if (job.title.toLowerCase().includes(term)) {
        score += 4;
      }

      // Skills match (priority 3)
      if (
        job.skills &&
        job.skills.some((skill) => skill.name.toLowerCase().includes(term))
      ) {
        score += 3;
      }

      // Company match (priority 2)
      if (job.company.name.toLowerCase().includes(term)) {
        score += 2;
      }

      // Description match (priority 1)
      if (job.description && job.description.toLowerCase().includes(term)) {
        score += 1;
      }

      return { ...job, _searchScore: score };
    })
    .filter((job) => job._searchScore > 0) // Only include jobs with matches
    .sort((a, b) => {
      // First by search score (desc), then by created_at (desc)
      if (b._searchScore !== a._searchScore) {
        return b._searchScore - a._searchScore;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .map(({ _searchScore, ...job }) => job); // Remove the score field
}

export const useJobStore = create<JobsState>((set, get) => ({
  jobs: [],
  loading: false,
  loadingMore: false,
  page: 0,
  hasMore: true,
  lastFetchKey: null,
  error: null,
  searchTerm: "",
  isSearching: false,

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

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  clearSearch: () => {
    const currentState = get();
    set({ searchTerm: "", isSearching: false });

    // Refetch jobs without search to restore original list
    // We need to get user and profile from somewhere - this might need to be called from the component
    console.log("JobStore: Search cleared, will need to refetch jobs");
  },

  fetchJobs: async (user: User, profile: UserProfile, force = false) => {
    const currentState = get();
    const fetchKey = createFetchKey(user, profile, currentState.searchTerm);

    // Prevent duplicate fetches for the same user/profile/search combo
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

    const isSearchActive =
      currentState.searchTerm && currentState.searchTerm.length >= 2;
    console.log(
      "JobStore: Fetching jobs for",
      fetchKey,
      force ? "(forced)" : "",
      isSearchActive ? `(search: "${currentState.searchTerm}")` : ""
    );

    try {
      set({
        loading: true,
        lastFetchKey: fetchKey,
        error: null,
        page: 0,
        hasMore: true,
        isSearching: !!isSearchActive,
      });

      const query = buildJobQuery(
        user,
        profile,
        0,
        PAGE_SIZE,
        currentState.searchTerm
      );
      const { data, error } = await query;

      if (error) throw error;

      let mappedJobs = (data ?? []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        created_at: job.created_at,
        status: Array.isArray(job.status) ? job.status[0] : job.status, // assuming it's an array
        company: Array.isArray(job.company) ? job.company[0] : job.company,
        category: Array.isArray(job.category) ? job.category[0] : job.category,
        skills: Array.isArray(job.skills)
          ? job.skills.flatMap((s: any) => s.skill ?? [])
          : [], // ← always an array
        applied:
          user.role.name === "candidate"
            ? job.job_applications?.some(
                (app: any) => app.candidate_id === user.id
              ) || false
            : false,
        nb_candidates: job.job_applications?.length || 0,
      }));

      // Apply client-side relevance sorting for search results
      if (isSearchActive) {
        mappedJobs = sortJobsByRelevance(
          mappedJobs,
          currentState.searchTerm
        ) as {
          id: any;
          title: any;
          description: any;
          created_at: any;
          status: any;
          company: any;
          category: any;
          skills: any;
          applied: any;
          nb_candidates: any;
        }[];
      }

      set({
        jobs: mappedJobs,
        loading: false,
        page: 1,
        hasMore: mappedJobs.length === PAGE_SIZE,
      });

      console.log(
        "JobStore: Fetched",
        mappedJobs.length,
        "jobs",
        isSearchActive ? "(filtered)" : ""
      );
    } catch (err: any) {
      console.error("JobStore: Error fetching jobs:", err);
      set({ jobs: [], loading: false, error: err.message, hasMore: false });
    }
  },

  fetchMoreJobs: async (user: User, profile: UserProfile) => {
    const currentState = get();
    const fetchKey = createFetchKey(user, profile, currentState.searchTerm);

    // Don't fetch if already loading, no more data, or different user/profile/search
    if (
      currentState.loadingMore ||
      !currentState.hasMore ||
      currentState.lastFetchKey !== fetchKey
    ) {
      return;
    }

    const isSearchActive =
      currentState.searchTerm && currentState.searchTerm.length >= 2;
    console.log(
      "JobStore: Fetching more jobs, page",
      currentState.page,
      isSearchActive ? `(search: "${currentState.searchTerm}")` : ""
    );

    try {
      set({ loadingMore: true, error: null });

      const query = buildJobQuery(
        user,
        profile,
        currentState.page,
        PAGE_SIZE,
        currentState.searchTerm
      );
      const { data, error } = await query;

      if (error) throw error;

      let mappedJobs = (data ?? []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        created_at: job.created_at,
        status: job.status,
        company: job.company,
        category: job.category,
        skills: Array.isArray(job.skills)
          ? job.skills.flatMap((s: any) => s.skill ?? [])
          : [], // ← always an array
        applied:
          user.role.name === "candidate"
            ? job.job_applications?.some(
                (app: any) => app.candidate_id === user.id
              ) || false
            : false,
        nb_candidates: job.job_applications?.length || 0,
      }));

      // Apply client-side relevance sorting for search results
      if (isSearchActive) {
        mappedJobs = sortJobsByRelevance(
          mappedJobs,
          currentState.searchTerm
        ) as {
          id: any;
          title: any;
          description: any;
          created_at: any;
          status: any;
          company: any;
          category: any;
          skills: any;
          applied: any;
          nb_candidates: any;
        }[];
      }

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

      console.log(
        "JobStore: Fetched",
        mappedJobs.length,
        "more jobs",
        isSearchActive ? "(filtered)" : ""
      );
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
      searchTerm: "",
      isSearching: false,
    });
  },
}));
