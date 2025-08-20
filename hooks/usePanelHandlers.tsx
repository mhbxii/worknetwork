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

  // Memoize the user role to prevent unnecessary callback recreations
  const userRole = useMemo(() => user?.role?.name, [user?.role?.name]);

  // Helper to close all panels
  const closeAllPanels = useCallback(() => {
    setPanelVisible(false);
    setBottomPanelVisible(false);
  }, []);

  const handlePress = useCallback(
    (job: Job) => {
      // Close any open panels first
      closeAllPanels();
      
      
      if (userRole === "candidate") {
        setPanelMode("candidateDetails");
        setPanelVisible(true);
      } else if (userRole === "recruiter") {
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
        // Close any open panels first
        closeAllPanels();
        setSelectedJob(job);
        setPanelMode("recruiterDetails");
        setPanelVisible(true);
      }
    },
    [userRole, closeAllPanels]
  );

  // Memoized panel close handlers
  const closeSidePanel = useCallback(() => setPanelVisible(false), []);
  const closeBottomPanel = useCallback(() => setBottomPanelVisible(false), []);

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