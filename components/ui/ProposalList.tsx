import type { Proposal } from "@/types/entities";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import ProposalCard from "./ProposalCard";

type Props = {
  proposals: Proposal[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onPress: (proposal: Proposal) => void;
  onLongPress: (proposal: Proposal) => void;
};

export function ProposalList({
  proposals,
  loading,
  loadingMore,
  hasMore,
  onRefresh,
  onLoadMore,
  onPress,
  onLongPress
}: Props) {

  const renderFooter = () => {
    if (!loadingMore) return null;
   
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator animating size="small" />
        <Text style={styles.footerText}>Loading more proposals...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      onLoadMore();
    }
  };

  if ((proposals ?? []).length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No proposals available.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={proposals}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ProposalCard
          proposal={item}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.75}
      ListFooterComponent={renderFooter}
      contentContainerStyle={(proposals ?? []).length === 0 ? styles.flatListEmpty : undefined}
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});