import { useAuth } from "@/store/authStore";
import { useJobStore } from "@/store/useJobStore";
import { useCallback, useEffect, useMemo } from "react";

export function useHome() {
  const { profile, user } = useAuth();
  const { jobs, loading, fetchJobs, reset } = useJobStore();

  // Create stable dependency key
  const profileKey = useMemo(() => {
    if (!profile || !user) return null;
    
    if (user.role.name === "candidate" && "job_category" in profile) {
      return `candidate_${profile.job_category?.id}`;
    } else if (user.role.name === "recruiter" && "company" in profile) {
      return `recruiter_${profile.company?.id}`;
    }
    return `${user.role.name}_${user.id}`;
  }, [profile, user]);

  // Refresh function for pull-to-refresh (force = true)
  const refresh = useCallback(async () => {
    if (user && profile) {
      await fetchJobs(user, profile, true); // Force refresh
    }
  }, [user, profile, fetchJobs]);

  useEffect(() => {
    if (!user || !profile || !profileKey) {
      console.log("useHome: No user/profile/profileKey, resetting jobs");
      reset();
      return;
    }

    // Fetch jobs only if we don't have them yet (force = false)
    fetchJobs(user, profile, false);
  }, [user?.id, profileKey, fetchJobs, reset]); // Use profileKey instead of individual properties

  return { 
    jobs, 
    loading, 
    refresh 
  };
}