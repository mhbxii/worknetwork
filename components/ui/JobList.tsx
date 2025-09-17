// JobList.tsx — Updated with search support
import type { Job } from "@/types/entities";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import JobCard from "./JobCard";

type Props = {
  jobs: Job[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchTerm?: string;
  isSearching?: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPress: (job: Job) => void;
  onLongPress: (job: Job) => void;
  onScroll?: (event: any) => void;
  headerSpacerHeight?: number;
};

export function JobList({
  jobs,
  loading,
  loadingMore,
  hasMore,
  searchTerm = "",
  isSearching = false,
  onRefresh,
  onLoadMore,
  onPress,
  onLongPress,
  onScroll,
  headerSpacerHeight = 0,
}: Props) {
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" />
        <Text style={styles.footerText}>
          {isSearching ? "Searching..." : "Loading more jobs..."}
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!searchTerm || searchTerm.length < 2) return null;
    
    return (
      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsText}>
          {loading ? "Searching..." : `Found ${jobs.length} job${jobs.length !== 1 ? 's' : ''} for "${searchTerm}"`}
        </Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      onLoadMore();
    }
  };

  // Empty state handling
  if ((jobs ?? []).length === 0 && !loading) {
    const emptyMessage = searchTerm && searchTerm.length >= 2 
      ? `No jobs found for "${searchTerm}"`
      : "No jobs available.";
      
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={[styles.emptyContainer, { paddingTop: headerSpacerHeight }]}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {searchTerm && searchTerm.length >= 2 && (
            <Text style={styles.emptySubText}>
              Try adjusting your search terms or browse all available jobs.
            </Text>
          )}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <JobCard 
            job={item} 
            onPress={onPress} 
            onLongPress={onLongPress}
          />
        )}
        // Spacer that pushes content below your absolute header
        ListHeaderComponent={() => (
          <>
            {headerSpacerHeight > 0 && <View style={{ height: headerSpacerHeight }} />}
            {renderHeader()}
          </>
        )}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={onRefresh}
            progressViewOffset={headerSpacerHeight} // Offset for the header
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.75}
        ListFooterComponent={renderFooter}
        contentContainerStyle={
          (jobs ?? []).length === 0 ? styles.flatListEmpty : undefined
        }
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  flatListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  searchResultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  searchResultsText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "500",
  },
});