import { useAuth } from "@/store/authStore";
import { Job } from "@/types/entities";
import { useCallback, useMemo, useState } from "react";

type PanelMode = "candidateDetails" | "recruiterDetails" | null;
type BottomPanelMode = "recruiterActions" | null;

export function usePanelHandlers() {
  const { user } = useAuth();
  
  // Side panel state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  
  // Bottom panel state
  const [selectedBottomJob, setSelectedBottomJob] = useState<Job | null>(null);
  const [bottomPanelMode, setBottomPanelMode] = useState<BottomPanelMode>(null);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(false);

  const userRole = useMemo(() => user?.role?.name, [user?.role?.name]);

  // Helper to close all panels and clear selection/modes
  const closeAllPanels = useCallback(() => {
    setPanelVisible(false);
    setBottomPanelVisible(false);
    // keep modes/selected cleared to avoid stale renders
    setPanelMode(null);
    setBottomPanelMode(null);
    setSelectedJob(null);
    setSelectedBottomJob(null);
  }, []);

  const handlePress = useCallback(
    (job: Job) => {
      // Close any open panels first (makes behavior predictable)
      closeAllPanels();

      if (userRole === "candidate") {
        setSelectedJob(job);                // <- essential
        setPanelMode("candidateDetails");
        setPanelVisible(true);
      } else if (userRole === "recruiter") {
        // ensure side panel cleared when opening bottom panel
        setSelectedJob(null);
        setSelectedBottomJob(job);
        setBottomPanelMode("recruiterActions");
        setBottomPanelVisible(true);
      }
    },
    [userRole, closeAllPanels]
  );

  const handleLongPress = useCallback(
    (job: Job) => {
      if (userRole === "recruiter") {
        closeAllPanels();
        setSelectedJob(job);
        setPanelMode("recruiterDetails");
        setPanelVisible(true);
      }
    },
    [userRole, closeAllPanels]
  );

  // Close handlers (exposed as named functions)
  const closeSidePanel = useCallback(() => {
    setPanelVisible(false);
    setPanelMode(null);
    setSelectedJob(null);
  }, []);
  const closeBottomPanel = useCallback(() => {
    setBottomPanelVisible(false);
    setBottomPanelMode(null);
    setSelectedBottomJob(null);
  }, []);

  return {
    // Side panel
    selectedJob,
    panelMode,
    panelVisible,
    setPanelVisible: closeSidePanel,
    
    // Bottom panel
    selectedBottomJob,
    bottomPanelMode,
    bottomPanelVisible,
    setBottomPanelVisible: closeBottomPanel,
    
    // Handlers
    handlePress,
    handleLongPress,
  };
}
