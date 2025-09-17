// screens/JobProposalDetails.tsx
import { ProposalActionSheet } from "@/components/ui/ProposalActionSheet";
import { ProposalList } from "@/components/ui/ProposalList";
import { Toast } from "@/components/ui/Toast";
import { useJobProposals } from "@/hooks/useJobProposals";
import { proposalService } from "@/services/proposalService";
import { useAuth } from "@/store/authStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { Job, Proposal } from "@/types/entities";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface JobProposalDetailsProps {
  job: Job;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error";
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

  // Action sheet state
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  // Store selectors
  const { isProposalViewed, sendJobViewedNotification, markProposalViewedLocally, sendNotification } = useNotificationsStore();
  const { user: currentUser } = useAuth();
  
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

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
      if (currentUser && currentUser.id === targetId) return;
      // fire-and-forget; store handles errors/logging
      sendJobViewedNotification(targetId, job.id, proposal.id);
    },
    [sendJobViewedNotification, currentUser, job.id, isProposalViewed, markProposalViewedLocally]
  );

  const handleProposalLongPress = useCallback((proposal: Proposal) => {
    console.log("Proposal long pressed - open context menu:", proposal.id);
    setSelectedProposal(proposal);
    setActionSheetVisible(true);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setActionSheetVisible(false);
    setSelectedProposal(null);
  }, []);

  const handleAcceptProposal = useCallback(async (proposal: Proposal) => {
    if (!currentUser) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      // Send notification first
      const notificationContent = `Your proposal for "${job.title}" has been accepted! 🎉`;
      await sendNotification(proposal.user.id, "accepted", notificationContent, job.id);

      // Handle proposal action
      const result = await proposalService.handleProposalAction({
        proposal,
        job,
        recruiter: currentUser,
        action: 'accept',
      });

      if (result.success) {
        showToast("Proposal accepted successfully!", "success");
        // Refresh proposals to show updated status
        refreshProposals();
      } else {
        showToast(result.error || "Failed to accept proposal", "error");
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      showToast("Failed to accept proposal", "error");
    }
  }, [currentUser, job, sendNotification, refreshProposals, showToast]);

  const handleRejectProposal = useCallback(async (proposal: Proposal) => {
    if (!currentUser) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      // Send notification first
      const notificationContent = `Your proposal for "${job.title}" was not selected this time.`;
      await sendNotification(proposal.user.id, "rejected", notificationContent, job.id);

      // Handle proposal action
      const result = await proposalService.handleProposalAction({
        proposal,
        job,
        recruiter: currentUser,
        action: 'reject',
      });

      if (result.success) {
        showToast("Proposal rejected", "success");
        // Refresh proposals to show updated status
        refreshProposals();
      } else {
        showToast(result.error || "Failed to reject proposal", "error");
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      showToast("Failed to reject proposal", "error");
    }
  }, [currentUser, job, sendNotification, refreshProposals, showToast]);

  const handleReportProposal = useCallback(async (proposal: Proposal) => {
    await proposalService.reportProposal(proposal.id);
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

      <ProposalActionSheet
        visible={actionSheetVisible}
        proposal={selectedProposal}
        onClose={handleCloseActionSheet}
        onAccept={handleAcceptProposal}
        onReject={handleRejectProposal}
        onReport={handleReportProposal}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
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