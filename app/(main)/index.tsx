// Index.tsx — Updated with SearchBar
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
import { SearchBar } from "@/components/ui/SearchBar";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { usePanelHandlers } from "@/hooks/usePanelHandlers";
import { useAuth } from "@/store/authStore";
import { useJobStore } from "@/store/useJobStore";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44;
const HEADER_CONTENT_HEIGHT = 66; // your header content height
const HEADER_HEIGHT = STATUS_BAR_HEIGHT + HEADER_CONTENT_HEIGHT;
const SEARCH_BAR_HEIGHT = 56; // search bar height

export default memo(function Index() {
  const { profile, initialized, user } = useAuth();
  const {
    jobs,
    loading,
    loadingMore,
    hasMore,
    searchTerm,
    isSearching,
    fetchJobs,
    fetchMoreJobs,
    setSearchTerm,
    clearSearch,
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

  // --- Search bar state ---
  const [searchBarVisible, setSearchBarVisible] = React.useState(false);
  const searchBarAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = shown
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const animateSearchBarTo = useCallback(
    (toVisible: boolean) => {
      Animated.timing(searchBarAnim, {
        toValue: toVisible ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [searchBarAnim]
  );

  // hide header when panel opens, show when closes
  useEffect(() => {
    if (panelVisible || bottomPanelVisible) {
      animateHeaderTo(true);
    } else {
      animateHeaderTo(false);
    }
  }, [panelVisible, bottomPanelVisible, animateHeaderTo]);

  // Animate search bar
  useEffect(() => {
    animateSearchBarTo(searchBarVisible);
  }, [searchBarVisible, animateSearchBarTo]);

  // Create stable dependency key for effect
  const profileKey = useMemo(() => {
    if (!profile || !user?.role?.name) return null; // Safe check

    if (user.role.name === "candidate" && "job_category" in profile) {
      return `candidate_${profile.job_category?.id}_${searchTerm}`;
    } else if (user.role.name === "recruiter" && "company" in profile) {
      return `recruiter_${profile.company?.id}_${searchTerm}`;
    }
    return `${user.role.name}_${user.id}_${searchTerm}`;
  }, [profile, user, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!user || !profile) return;

    if (searchTerm.length >= 2) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      searchDebounceRef.current = setTimeout(() => {
        fetchJobs(user, profile, true);
      }, 300);
    } else if (searchTerm.length === 0) {
      // Clear search immediately
      fetchJobs(user, profile, true);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, user, profile, fetchJobs]);

  // Fetch jobs effect (initial load only, search is handled by debounced effect)
  useEffect(() => {
    if (!user || !profile || !profileKey) {
      console.log("Index: No user/profile/profileKey, resetting jobs");
      reset();
      return;
    }

    // Only fetch if no search term (initial load)
    if (!searchTerm) {
      fetchJobs(user, profile, false);
    }
  }, [user, profile, profileKey, fetchJobs, reset]); // Removed searchTerm to avoid duplicate fetches

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

  // Search handlers
  const handleSearchPress = useCallback(() => {
    if (panelVisible) setPanelVisible();               // toggle-close only if open
    if (bottomPanelVisible) setBottomPanelVisible();   // same
    animateHeaderTo(false);
    setSearchBarVisible(true);
  }, [panelVisible, bottomPanelVisible, setPanelVisible, setBottomPanelVisible, animateHeaderTo]);  

  const handleSearchClose = useCallback(() => {
    setSearchBarVisible(false);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    if (user && profile) {
      fetchJobs(user, profile, true);
    }
  }, [setSearchTerm, user, profile, fetchJobs]);

  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchTerm(text);
    },
    [setSearchTerm]
  );

  // Scroll handler forwarded from JobList
  const handleScroll = useCallback(
    (event: any) => {
      // event.nativeEvent.contentOffset.y
      const y = event?.nativeEvent?.contentOffset?.y ?? 0;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      // If panel is open, keep header hidden
      if (panelVisible) return;

      // Hide search bar when scrolling (but keep search active)
      if (searchBarVisible && Math.abs(delta) > 5) {
        setSearchBarVisible(false);
      }

      const THRESHOLD = 12; // px
      if (delta > THRESHOLD) {
        // scrolling up -> hide header
        animateHeaderTo(true);
      } else if (delta < -THRESHOLD) {
        // scrolling down -> show header
        animateHeaderTo(false);
      }
    },
    [animateHeaderTo, panelVisible, searchBarVisible]
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
    searchTerm,
    isSearching,
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

  // animated search bar style
  const searchBarTranslateY = searchBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SEARCH_BAR_HEIGHT, 0],
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
          {!searchBarVisible && <Text style={styles.headerTitle}>Home</Text>}
          <SearchBar
            visible={searchBarVisible}
            searchTerm={searchTerm}
            onPress={handleSearchPress}
            onClose={handleSearchClose}
            onClear={handleSearchClear}
            onChangeText={handleSearchTextChange}
          />
        </View>
      </Animated.View>

      {/* Main content — forward onScroll to control header */}
      <View style={{ flex: 1 }}>
        <JobList
          jobs={jobs}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          searchTerm={searchTerm}
          isSearching={isSearching}
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
    backgroundColor: "rgba(255,255,255,0)", // keep opaque so status bar remains visible
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0)",
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
  searchBarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1100,
    backgroundColor: "#f00",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
});
