// JobList.tsx — patched to forward onScroll
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
  onRefresh: () => void;
  onLoadMore: () => void;
  onPress: (job: Job) => void;
  onLongPress: (job: Job) => void;
  onScroll?: (event: any) => void; // <-- new optional prop
  headerSpacerHeight?: number; // <-- new optional prop
};

export function JobList({
  jobs,
  loading,
  loadingMore,
  hasMore,
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
        <Text style={styles.footerText}>Loading more jobs...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      onLoadMore();
    }
  };

  if ((jobs ?? []).length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No jobs available.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <JobCard job={item} onPress={onPress} onLongPress={onLongPress} />
      )}
      // <-- spacer that pushes content below your absolute header
      ListHeaderComponent={headerSpacerHeight ? <View style={{ height: headerSpacerHeight }} /> : null}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.75}
      ListFooterComponent={renderFooter}
      contentContainerStyle={
        (jobs ?? []).length === 0 ? styles.flatListEmpty : undefined
      }
      showsVerticalScrollIndicator={false}
      onScroll={onScroll} // <-- forward scroll events
      scrollEventThrottle={16} // <-- important for smooth animations
    /></LinearGradient>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
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
  container: {
    flex: 1,
  },
});
