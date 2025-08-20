import { CandidateJobDetails } from "@/components/CandidateJobDetails";
import { JobProposalDetails } from "@/components/JobProposalDetails";
import { RecruiterJobDetails } from "@/components/RecruiterJobDetails";
import { BottomPanel } from "@/components/ui/BottomPanel";
import { JobList } from "@/components/ui/JobList";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { usePanelHandlers } from "@/hooks/usePanelHandlers";
import { useAuth } from "@/store/authStore";
import { useJobStore } from "@/store/useJobStore";
import { memo, useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator } from "react-native-paper";

export default memo(function Index() {
  const { profile, initialized, user } = useAuth();
  const {
    jobs,
    loading,
    loadingMore,
    hasMore,
    fetchJobs,
    fetchMoreJobs,
    reset
  } = useJobStore();

  const {
    selectedJob,
    panelMode,
    panelVisible,
    setPanelVisible,
    selectedBottomJob,
    bottomPanelMode,
    bottomPanelVisible,
    setBottomPanelVisible,
    handlePress,
    handleLongPress,
  } = usePanelHandlers();

  // Create stable dependency key for effect
  const profileKey = useMemo(() => {
    if (!profile || !user?.role?.name) return null; // Safe check
   
    if (user.role.name === "candidate" && "job_category" in profile) {
      return `candidate_${profile.job_category?.id}`;
    } else if (user.role.name === "recruiter" && "company" in profile) {
      return `recruiter_${profile.company?.id}`;
    }
    return `${user.role.name}_${user.id}`;
  }, [profile, user]);

  // Fetch jobs effect
  useEffect(() => {
    if (!user || !profile || !profileKey) {
      console.log("Index: No user/profile/profileKey, resetting jobs");
      reset();
      return;
    }
    fetchJobs(user, profile, false);
  }, [user, profile, profileKey, fetchJobs, reset]);

  // Refresh handler (force reload)
  const handleRefresh = useCallback(() => {
    if (user && profile) {
      fetchJobs(user, profile, true);
    }
  }, [user, profile, fetchJobs]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (user && profile) {
      fetchMoreJobs(user, profile);
    }
  }, [user, profile, fetchMoreJobs]);

  // Only show loading when not initialized or no profile
  if (!initialized || !profile) {
    return <ActivityIndicator animating size="large" />;
  }

  console.log("Index render:", {
    initialized,
    hasProfile: !!profile,
    jobsLength: jobs.length,
    loading,
    loadingMore,
    hasMore,
    timestamp: new Date().toISOString()
  });

  return (
    <>
      <JobList
        jobs={jobs}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
     
      {/* Side Panel */}
      <SlidePanel
        visible={panelVisible}
        onClose={setPanelVisible}
      >
        {panelMode === "candidateDetails" && selectedJob && (
          <CandidateJobDetails job={selectedJob} />
        )}
        {panelMode === "recruiterDetails" && selectedJob && (
          <RecruiterJobDetails job={selectedJob} />
        )}
      </SlidePanel>

      {/* Bottom Panel */}
      <BottomPanel
        visible={bottomPanelVisible}
        onClose={setBottomPanelVisible}
      >
        {bottomPanelMode === "recruiterActions" && selectedBottomJob && (
          <JobProposalDetails job={selectedBottomJob} />
        )}
      </BottomPanel>
    </>
  );
});