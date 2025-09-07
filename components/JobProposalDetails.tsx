import { ProposalList } from "@/components/ui/ProposalList";
import { useJobProposals } from "@/hooks/useJobProposals";
import { useAuth } from "@/store/authStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { Job, Proposal } from "@/types/entities";
import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";

interface JobProposalDetailsProps {
  job: Job;
}

export const JobProposalDetails: React.FC<JobProposalDetailsProps> = ({
  job,
}) => {
  const {
    proposals,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshProposals,
    fetchMoreProposals,
  } = useJobProposals(job.id);

  // selectors
  const { isProposalViewed, sendJobViewedNotification, markProposalViewedLocally} = useNotificationsStore();

  const currentUserId = useAuth((s) => s.user?.id); // adjust if your auth hook differs

  const handleProposalPress = useCallback(
    (proposal: Proposal) => {
      console.log("Proposal pressed:", proposal.id);

      if (isProposalViewed(proposal.id)) {
        console.log("Already viewed, skipping notification");
        return;
      }
    
      markProposalViewedLocally(proposal.id);

      const targetId = proposal?.user?.id;
      if (!targetId) {
        console.log("No target user id on proposal — skipping notification");
        return;
      }

      // don't notify yourself
      if (currentUserId && currentUserId === targetId) return;

      // fire-and-forget; store handles errors/logging
      sendJobViewedNotification(targetId, job.id, proposal.id);
    },
    [sendJobViewedNotification, currentUserId, job.id]
  );

  const handleProposalLongPress = useCallback((proposal: Proposal) => {
    console.log("Proposal long pressed - open context menu:", proposal.id);
    // context menu logic lives elsewhere
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load proposals: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.proposalCount}>
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ProposalList
        proposals={proposals}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onRefresh={refreshProposals}
        onLoadMore={fetchMoreProposals}
        onPress={handleProposalPress}
        onLongPress={handleProposalLongPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderColor: "#e5e7eb",
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  proposalCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
});
