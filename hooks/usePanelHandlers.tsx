import { useAuth } from "@/store/authStore";
import { Job } from "@/types/entities";
import { useCallback, useMemo, useState } from "react";

type PanelMode = "candidateDetails" | "recruiterDetails" | null;

export function usePanelHandlers() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  // Memoize the user role to prevent unnecessary callback recreations
  const userRole = useMemo(() => user?.role?.name, [user?.role?.name]);

  const handlePress = useCallback(
    (job: Job) => {
      setSelectedJob(job);
      if (userRole === "candidate") {
        setPanelMode("candidateDetails");
      } else if (userRole === "recruiter") {
        setPanelMode("recruiterDetails");
      }
      setPanelVisible(true);
    },
    [userRole] // Stable dependency
  );

  const handleLongPress = useCallback(
    (job: Job) => {
      if (userRole === "recruiter") {
        setSelectedJob(job);
        setPanelMode("recruiterDetails");
        setPanelVisible(true);
      }
    },
    [userRole] // Stable dependency
  );

  // Memoize the setPanelVisible to prevent recreations
  const memoizedSetPanelVisible = useCallback(
    (visible: boolean) => setPanelVisible(visible),
    []
  );

  return {
    selectedJob,
    panelMode,
    panelVisible,
    setPanelVisible: memoizedSetPanelVisible,
    handlePress,
    handleLongPress,
  };
}