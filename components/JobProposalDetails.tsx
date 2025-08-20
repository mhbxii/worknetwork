import { ProposalList } from "@/components/ui/ProposalList";
import { useJobProposals } from "@/hooks/useJobProposals";
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

  const handleProposalPress = useCallback((proposal: Proposal) => {
    // Handle proposal expansion (already handled in ProposalCard)
    console.log("Proposal pressed:", proposal.id);
  }, []);

  const handleProposalLongPress = useCallback((proposal: Proposal) => {
    // Handle context menu - send email, etc.
    console.log("Proposal long pressed - open context menu:", proposal.id);
    // TODO: Show context menu with options like:
    // - Send email to candidate
    // - Schedule interview
    // - Accept/Reject proposal
    // - View full profile
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
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
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
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  proposalCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});