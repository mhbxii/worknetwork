// Index.tsx — REPLACE your current file with this
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { CandidateJobDetails } from "@/components/CandidateJobDetails";
import { JobProposalDetails } from "@/components/JobProposalDetails";
import { RecruiterJobDetails } from "@/components/RecruiterJobDetails";
import { BottomPanel } from "@/components/ui/BottomPanel";
import { JobList } from "@/components/ui/JobList";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { usePanelHandlers } from "@/hooks/usePanelHandlers";
import { useAuth } from "@/store/authStore";
import { useJobStore } from "@/store/useJobStore";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44;
const HEADER_CONTENT_HEIGHT = 56; // your header content height
const HEADER_HEIGHT = STATUS_BAR_HEIGHT + HEADER_CONTENT_HEIGHT;

export default memo(function Index() {
  const { profile, initialized, user } = useAuth();
  const {
    jobs,
    loading,
    loadingMore,
    hasMore,
    fetchJobs,
    fetchMoreJobs,
    reset,
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

  // --- Animated header state ---
  const headerAnim = useRef(new Animated.Value(0)).current; // 0 = shown, 1 = hidden
  const lastScrollY = useRef(0);
  const lastToggleAt = useRef(0);

  const animateHeaderTo = useCallback(
    (toHidden: boolean) => {
      // avoid rapid toggles
      const now = Date.now();
      if (now - lastToggleAt.current < 120) return;
      lastToggleAt.current = now;

      Animated.timing(headerAnim, {
        toValue: toHidden ? 1 : 0,
        duration: toHidden ? 220 : 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [headerAnim]
  );

  // hide when panel opens, show when closes
  useEffect(() => {
    if (panelVisible) {
      animateHeaderTo(true);
    } else {
      animateHeaderTo(false);
    }
  }, [panelVisible, animateHeaderTo]);

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

  // Scroll handler forwarded from JobList
  const handleScroll = useCallback(
    (event: any) => {
      // event.nativeEvent.contentOffset.y
      const y = event?.nativeEvent?.contentOffset?.y ?? 0;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      // If panel is open, keep header hidden
      if (panelVisible) return;

      const THRESHOLD = 12; // px
      if (delta > THRESHOLD) {
        // scrolling up -> hide header
        animateHeaderTo(true);
      } else if (delta < -THRESHOLD) {
        // scrolling down -> show header
        animateHeaderTo(false);
      }
    },
    [animateHeaderTo, panelVisible]
  );

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
    timestamp: new Date().toISOString(),
  });

  // animated header style
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -HEADER_HEIGHT],
  });
  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  return (
    <>
      {/* StatusBar (kept visible) */}
      <StatusBar barStyle="light-content" backgroundColor="#0f1724" />

      {/* Animated local header (absolute) */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.animatedHeader,
          {
            height: HEADER_HEIGHT,
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
            paddingTop: STATUS_BAR_HEIGHT,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Home</Text>
          {/* you can add right actions here if needed */}
        </View>
      </Animated.View>

      {/* Main content — forward onScroll to control header */}
      <View style={{ flex: 1 }}>
        <JobList
          jobs={jobs}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onPress={handlePress}
          onLongPress={handleLongPress}
          // forward scroll events; JobList should attach this to FlatList's onScroll
          onScroll={handleScroll}
          headerSpacerHeight={HEADER_HEIGHT}
        />

        {/* Side Panel */}
        <SlidePanel visible={panelVisible} onClose={setPanelVisible}>
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
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  animatedHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1200,
    backgroundColor: "#0f1724", // keep opaque so status bar remains visible
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
    justifyContent: "flex-end",
  },
  headerContent: {
    height: HEADER_CONTENT_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
