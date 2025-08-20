import { supabase } from "@/lib/supabase"; // Adjust import path as needed
import { CandidateProfile, MetaOption, Proposal, User } from "@/types/entities";
import { useCallback, useEffect, useState } from "react";

interface UseJobProposalsReturn {
  proposals: Proposal[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchProposals: () => void;
  fetchMoreProposals: () => void;
  refreshProposals: () => void;
}

const PAGE_SIZE = 10;

export function useJobProposals(jobId: number): UseJobProposalsReturn {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("job_applications")
        .select(
          `
            id,
            job_id,
            matched_score,
            created_at,
            updated_at,
            candidate:candidate_id (
              users!user_id (
                id,
                supabase_user_id,
                name,
                email,
                profile_pic_url,
                created_at,
                updated_at,
                role:role_id(id, name),
                country:country_id(id, name)
              )
            ),
            status:status_id(id, name)
          `
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        throw new Error(error.message);
      }

      // console.log(
      //   "useJobProposals: Fetched proposals for job: \n",
      //   JSON.stringify(data, null, 2)
      // );

      if (!data) {
        setProposals([]);
        setHasMore(false);
        setPage(1);
        return;
      }

      // Process the proposals and fetch candidate profiles
      const processedProposals = await Promise.all(
        data.map(async (item: any) => {
          const userData = item.candidate?.users;

          if (!userData) {
            throw new Error("User data is missing in candidate relationship");
          }

          const user: User = {
            id: userData.id,
            supabase_user_id: userData.supabase_user_id,
            name: userData.name,
            email: userData.email,
            profile_pic_url: userData.profile_pic_url,
            role: userData.role, // No need for Array.isArray here
            country: userData.country,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
          };

          const status: MetaOption = item.status;

          // Fetch candidate profile if user is a candidate
          let candidate: CandidateProfile | null = null;
          if (user.role?.name === "candidate") {
            candidate = await fetchCandidateProfile(user.id);
          }

          return {
            id: item.id,
            user,
            candidate,
            job_id: item.job_id,
            status,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            matched_score: item.matched_score,
          } as Proposal;
        })
      );

      setProposals(processedProposals);
      setPage(1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch proposals"
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const fetchMoreProposals = useCallback(async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const startRange = page * PAGE_SIZE;
      const endRange = startRange + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("job_applications")
        .select(
          `
            id,
            job_id,
            matched_score,
            created_at,
            updated_at,
            candidate:candidate_id (
              users!user_id (
                id,
                supabase_user_id,
                name,
                email,
                profile_pic_url,
                created_at,
                updated_at,
                role:role_id(id, name),
                country:country_id(id, name)
              )
            ),
            status:status_id(id, name)
          `
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .range(startRange, endRange);

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // Process the new proposals
      const processedProposals = await Promise.all(
        data.map(async (item: any) => {
          const userData = item.candidate?.users;

          if (!userData) {
            throw new Error("User data is missing in candidate relationship");
          }

          const user: User = {
            id: userData.id,
            supabase_user_id: userData.supabase_user_id,
            name: userData.name,
            email: userData.email,
            profile_pic_url: userData.profile_pic_url,
            role: userData.role, // No need for Array.isArray here
            country: userData.country,
            created_at: userData.created_at,
            updated_at: userData.updated_at,
          };

          const status: MetaOption = item.status;

          // Fetch candidate profile if user is a candidate
          let candidate: CandidateProfile | null = null;
          if (user.role?.name === "candidate") {
            candidate = await fetchCandidateProfile(user.id);
          }

          return {
            id: item.id,
            user,
            candidate,
            job_id: item.job_id,
            status,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            matched_score: item.matched_score,
          } as Proposal;
        })
      );

      setProposals((prev) => [...prev, ...processedProposals]);
      setPage((prev) => prev + 1);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch more proposals"
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, jobId]);

  const refreshProposals = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchProposals();
  }, [fetchProposals]);

  // Initial fetch
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchProposals,
    fetchMoreProposals,
    refreshProposals,
  };
}

// Helper function to fetch candidate profile (similar to your fetchUser pattern)
async function fetchCandidateProfile(
  userId: number
): Promise<CandidateProfile | null> {
  try {
    const candidateQ = supabase
      .from("candidates")
      .select("job_title, job_category_id, nb_proposals")
      .eq("user_id", userId)
      .single();

    const projectsQ = supabase
      .from("candidate_projects")
      .select("name, description, start_date, end_date")
      .eq("candidate_id", userId);

    const experiencesQ = supabase
      .from("candidate_experiences")
      .select("companies:company_id(id, name), job_title, start_date, end_date")
      .eq("candidate_id", userId);

    const skillsQ = supabase
      .from("candidate_skills")
      .select("skills:skill_id(id, name)")
      .eq("candidate_id", userId);

    const [
      { data: candidateData, error: candidateError },
      { data: projectsData, error: projectsError },
      { data: experiencesData, error: experiencesError },
      { data: skillsData, error: skillsError },
    ] = await Promise.all([candidateQ, projectsQ, experiencesQ, skillsQ]);

    if (candidateError || !candidateData) {
      return null;
    }

    // Fetch job category if exists
    let jobCategory: MetaOption | null = null;
    if (candidateData.job_category_id) {
      const { data: jobCategoryData } = await supabase
        .from("job_categories")
        .select("id, name")
        .eq("id", candidateData.job_category_id)
        .single();
      jobCategory = jobCategoryData || null;
    }

    // Process the data
    const projects = projectsData || [];
    const experiencesRaw = experiencesData || [];
    const skillsRaw = skillsData || [];

    const experiences = experiencesRaw.map((e: any) => ({
      company: e.companies
        ? { id: e.companies.id, name: e.companies.name }
        : null,
      job_title: e.job_title,
      start_date: e.start_date,
      end_date: e.end_date,
    }));

    const skills = skillsRaw
      .filter((s: any) => s.skills)
      .map((s: any) => ({ id: s.skills.id, name: s.skills.name }));

    // console.log({
    //   job_title: candidateData.job_title ?? "",
    //   job_category: jobCategory,
    //   nb_proposals: candidateData.nb_proposals ?? null,
    //   projects,
    //   experiences,
    //   skills: skills.length > 0 ? skills : null,
    // });

    return {
      job_title: candidateData.job_title ?? "",
      job_category: jobCategory,
      nb_proposals: candidateData.nb_proposals ?? null,
      projects,
      experiences,
      skills: skills.length > 0 ? skills : null,
    };
  } catch (err) {
    console.error("fetchCandidateProfile: Error fetching profile", err);
    return null;
  }
}
