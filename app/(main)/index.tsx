import { CandidateJobDetails } from "@/components/CandidateJobDetails";
import { RecruiterJobDetails } from "@/components/RecruiterJobDetails";
import { JobList } from "@/components/ui/JobList";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { useHome } from "@/hooks/useHome";
import { usePanelHandlers } from "@/hooks/usePanelHandlers";
import { useAuth } from "@/store/authStore";
import { memo } from "react";
import { ActivityIndicator } from "react-native-paper";

export default memo(function Index() {
  const { profile, initialized } = useAuth();
  const { jobs, loading, refresh } = useHome();
  const { 
    selectedJob, 
    panelMode, 
    panelVisible, 
    setPanelVisible, 
    handlePress, 
    handleLongPress,
  } = usePanelHandlers();

  // Only show component when everything is ready
  if (!initialized || !profile || jobs.length === 0) {
    return <ActivityIndicator animating size="large" />;
  }

  // Add debug logging to track renders
  console.log("Index render:", {
    initialized,
    hasProfile: !!profile,
    jobsLength: jobs.length,
    timestamp: new Date().toISOString()
  });

  return (
    <>
      <JobList 
        jobs={jobs} 
        loading={loading} 
        onRefresh={refresh} 
        onPress={handlePress} 
        onLongPress={handleLongPress} 
      />
      
      <SlidePanel 
        visible={panelVisible} 
        onClose={() => setPanelVisible(false)}
      >
        {panelMode === "candidateDetails" && selectedJob && (
          <CandidateJobDetails job={selectedJob} />
        )}
        {panelMode === "recruiterDetails" && selectedJob && (
          <RecruiterJobDetails job={selectedJob} />
        )}
      </SlidePanel>
    </>
  );
});