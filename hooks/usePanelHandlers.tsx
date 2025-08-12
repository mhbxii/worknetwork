import { useAuth } from "@/store/authStore";
import { Job } from "@/types/entities";
import { useCallback, useState } from "react";

type PanelMode = "candidateDetails" | "recruiterDetails" | null;

export function usePanelHandlers() {
  const { profile } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const handlePress = useCallback(
    (job: Job) => {
      setSelectedJob(job);
      if (profile?.role === "candidate") {
        setPanelMode("candidateDetails");
      } else if (profile?.role === "recruiter") {
        setPanelMode("recruiterDetails"); // for now, test slide panel for recruiters too
      }
      setPanelVisible(true);
    },
    [profile?.role]
  );

  const handleLongPress = useCallback(
    (job: Job) => {
      if (profile?.role === "recruiter") {
        setSelectedJob(job);
        setPanelMode("recruiterDetails");
        setPanelVisible(true);
      }
    },
    [profile?.role]
  );

  return {
    selectedJob,
    panelMode,
    panelVisible,
    setPanelVisible,
    handlePress,
    handleLongPress,
  };
}
