import type { Job, UserProfile } from "@/types/entities";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useHome(profile: UserProfile | null) {
  if (!profile) {
    console.warn(
      "useHome called without a valid profile. Returning empty state."
    );
    return { jobs: [], loading: false, refresh: () => Promise.resolve() };
  }

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      let query = buildJobQuery(profile);

      const { data, error } = await query;
      if (error) throw error;

      const mappedJobs = (data ?? []).map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        created_at: job.created_at,
        status: job.status?.name,
        company_name: job.company_name?.name,
        category_name: job.category_name?.name,
        skills:
          job.job_skills?.map((js: any) => js.skill_id?.name).filter(Boolean) ||
          [],
      }));

      setJobs(mappedJobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, refresh: fetchJobs };
}

function buildJobQuery(profile: UserProfile, page = 0, pageSize = 20) {
  let query = supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      description,
      created_at,
      status:status_id(name),
      company_name:company_id(name),
      category_name:job_category_id(name),
      job_skills:job_skills(
        skill_id (
          name
        )
      )
      `
    )    // job_skills!inner( excludes jobs without skills )
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (profile.role === "recruiter") {
    query = query.eq("company_id", profile.data?.company_id);
  } else if (profile.role === "candidate") {
    query = query.eq("job_category_id", profile.data?.job_category_id);
  }

  return query;
}
