import type { Job } from "@/types/entities";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import JobCard from "./JobCard";

type Props = {
  jobs: Job[];
  loading: boolean;
  onRefresh: () => void;
  onPress: (job: Job) => void;
  onLongPress: (job: Job) => void;
};

export function JobList({ jobs, loading, onRefresh, onPress, onLongPress }: Props) {
  if ((jobs ?? []).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No jobs available.</Text>
      </View>
    );
  }

  return (
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
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh}  />
      }
      contentContainerStyle={(jobs ?? []).length === 0 ? styles.flatListEmpty : undefined}
      showsVerticalScrollIndicator={false}
    />
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
});
