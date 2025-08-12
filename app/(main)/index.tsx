import { CandidateJobDetails } from "@/components/CandidateJobDetails";
import { RecruiterJobDetails } from "@/components/RecruiterJobDetails";
import { JobList } from "@/components/ui/JobList";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { useHome } from "@/hooks/useHome";
import { usePanelHandlers } from "@/hooks/usePanelHandlers";
import { useAuth } from "@/store/authStore";
import { ActivityIndicator, Text } from "react-native-paper";

export default function Index() {
  const { profile, initialized } = useAuth();
  const { jobs, loading, refresh } = useHome(profile);

  const {
    selectedJob,
    panelMode,
    panelVisible,
    setPanelVisible,
    handlePress,
    handleLongPress,
  } = usePanelHandlers();

  if (!initialized) return <ActivityIndicator animating size="large" />;

  if (!profile) return <Text>Error: User profile not found.</Text>;

  return (
    <>
      <JobList
        jobs={jobs}
        loading={loading}
        onRefresh={refresh}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />

      <SlidePanel visible={panelVisible} onClose={() => setPanelVisible(false)}>
        {panelMode === "candidateDetails" && selectedJob && (
          <CandidateJobDetails job={selectedJob} />
        )}
        {panelMode === "recruiterDetails" && selectedJob && (
          <RecruiterJobDetails job={selectedJob} />
        )}
      </SlidePanel>
    </>
  );
}
