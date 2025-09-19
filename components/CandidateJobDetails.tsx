import { Toast } from "@/components/ui/Toast";
import { useAIMatching } from "@/hooks/useAIMatching";
import { supabase } from "@/lib/supabase";
import { createMatchingPrompt } from "@/services/createMatchingPrompt"; // or wherever you put it
import { useAuth } from "@/store/authStore";
import { useChatStore } from "@/store/useChatStore";
import { useJobStore } from "@/store/useJobStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { FetchedRecruiter, Job } from "@/types/entities";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

interface CandidateJobDetailsProps {
  job: Job;
}

export const CandidateJobDetails: React.FC<CandidateJobDetailsProps> = ({
  job,
}) => {
  const { sendNotification } = useNotificationsStore.getState();
  const { profile, user, setProfile } = useAuth();
  const { updateJobApplication } = useJobStore();
  const { sendMessage } = useChatStore();
  const [nbProposals, setNbProposals] = useState(
    "nb_proposals" in profile! ? profile.nb_proposals ?? 0 : 0
  );
  const [recruiters, setRecruiters] = useState<FetchedRecruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(job.applied ?? false);
  const [applying, setApplying] = useState(false);
  const { calculateMatchingScore } = useAIMatching();

  // Message modal state
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<FetchedRecruiter | null>(null);
  const [messageText, setMessageText] = useState("");

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    async function fetchRecruiters() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("hrs")
          .select("user_id, position_title")
          .eq("company_id", job.company.id);

        if (error) {
          console.error("Error fetching recruiters:", error);
          setRecruiters([]);
        } else {
          // map to the format used in UI
          const mapped =
            data?.map((r) => ({
              user_id: r.user_id,
              position_title: r.position_title,
              company: {
                id: job.company.id,
                name:
                  "@" +
                  job.company.name[0].toUpperCase() +
                  job.company.name.slice(1).toLowerCase(),
              }, // reuse current job.company
            })) ?? [];

          setRecruiters(mapped);
        }
      } catch (err) {
        console.error("Unexpected error fetching recruiters:", err);
        setRecruiters([]);
      } finally {
        setLoading(false);
      }
    }

    if (job.company?.id) fetchRecruiters();
  }, [job.company?.id]);

  const updateJobInStore = (jobId: number) => {
    updateJobApplication(jobId, true);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const handleMessage = (recruiter: FetchedRecruiter) => {
    setSelectedRecruiter(recruiter);
    setMessageText("");
    setMessageModalVisible(true);
  };

  const handleSendMessage = async () => {
    if (
      !messageText.trim() ||
      messageText.length < 1 ||
      messageText.length > 255
    ) {
      showToast("Message must be between 1 and 255 characters", "error");
      return;
    }

    if (!selectedRecruiter || !user) {
      showToast("Unable to send message", "error");
      return;
    }

    // Close modal immediately
    setMessageModalVisible(false);
    setSelectedRecruiter(null);

    // Send message in background
    try {
      await sendMessage(user.id, selectedRecruiter.user_id, messageText.trim());
      showToast("Message sent successfully", "success");
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Failed to send message", "error");
    }

    setMessageText("");
  };

  const closeMessageModal = () => {
    setMessageModalVisible(false);
    setSelectedRecruiter(null);
    setMessageText("");
  };

  const sendApplicationNotifications = async (jobTitle: string, companyId: number) => {
    try {
      // Fetch recruiters for this company
      const { data: recruiters, error } = await supabase
        .from("hrs")
        .select("user_id")
        .eq("company_id", companyId);
  
      if (error || !recruiters) {
        console.error("Error fetching recruiters for notifications:", error);
        return;
      }
  
      // Send notification to each recruiter
      
      const notifications = recruiters.map(recruiter => 
        sendNotification(
          recruiter.user_id,
          "virgin",
          `New application received for ${jobTitle}`,
          job.id
        )
      );
  
      await Promise.all(notifications);
      console.log(`Sent application notifications to ${recruiters.length} recruiters`);
    } catch (err) {
      console.error("Failed to send application notifications:", err);
    }
  };

  const handleJobApplication = async () => {
    if (nbProposals <= 0) {
      console.log("You've hit your limits! You cant apply for this job now.");
      return;
    }

    if (isApplied) {
      console.log("You have already applied for this job.");
      alert("You have already applied for this job.");
      return;
    }

    setApplying(true);

    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        candidate_id: user!.id,
        status_id: 3, // Assuming 3 is the status for "Pending"
      });

      if (error) {
        console.error("Error applying for job:", error);
        alert("Failed to apply for the job. Please try again later.");
      } else {
        // Decrease the number of proposals left
        await supabase
          .from("candidates")
          .update({ nb_proposals: nbProposals - 1 })
          .eq("user_id", user!.id);

        // Notify user of successful application
        console.log("Application submitted successfully!");
        alert("Application submitted successfully!");

        // Send notifications to recruiters
        sendApplicationNotifications(job.title, job.company.id);

        // Update local profile state
        if (profile && "nb_proposals" in profile) {
          setProfile({
            ...profile,
            nb_proposals: (profile.nb_proposals ?? 0) - 1,
          });
        }

        // Update local state
        setNbProposals((prev) => prev - 1);
        setIsApplied(true);

        // Update job in store: applied = true, nb_candidates + 1
        updateJobInStore(job.id);

        // Calculate matching score in background (fire-and-forget)
        if (profile && "skills" in profile) {
          const prompt = createMatchingPrompt(profile, job);
          calculateMatchingScore(prompt)
            .then(async (score) => {
              if (score > 0) {
                // Update the job_applications record with the matching score
                const { error: scoreError } = await supabase
                  .from("job_applications")
                  .update({ matched_score: score })
                  .eq("job_id", job.id)
                  .eq("candidate_id", user!.id);

                if (scoreError) {
                  console.error("Error updating matching score:", scoreError);
                } else {
                  console.log(
                    `Matching score ${score}/10 saved for job ${job.id}`
                  );
                }
              }
            })
            .catch((err) => {
              console.error(
                "Background matching score calculation failed:",
                err
              );
            });
        }
      }
    } catch (err) {
      console.error("Unexpected error applying for job:", err);
      alert("An unexpected error occurred. Please try again later.");
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "#4caf50";
      case "closed":
        return "#f44336";
      case "paused":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.companySection}>
              <MaterialCommunityIcons name="domain" size={16} color="#cfcfba" />
              <Text style={styles.companyText}>{job.company.name}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(job.status.name) },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  job.status.name?.toLowerCase() === "open"
                    ? "briefcase-check"
                    : "briefcase"
                }
                size={12}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {job.status?.name.toUpperCase() || "OPEN"}
              </Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar" size={14} color="#bdbdbd" />
            <Text style={styles.dateText}>
              Posted {formatDate(job.created_at)}
            </Text>
          </View>

          {/* Candidates Count */}
          {job.nb_candidates !== null && job.nb_candidates > 0 && (
            <View style={styles.candidatesRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={14}
                color="#7c4dff"
              />
              <Text style={styles.candidatesText}>
                {job.nb_candidates} candidate
                {job.nb_candidates !== 1 ? "s" : ""} applied
              </Text>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {job.description || "No description provided."}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{job.category.name}</Text>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        {job.skills && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {job.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Apply Section */}
        <View style={styles.section}>
          <Pressable
            style={[
              styles.applyButton,
              (nbProposals <= 0 || isApplied || applying) &&
                styles.applyButtonDisabled,
            ]}
            disabled={nbProposals <= 0 || applying}
            onPress={handleJobApplication}
          >
            {applying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              !isApplied && (
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={nbProposals <= 0 ? "#666" : "#fff"}
                />
              )
            )}
            <Text style={styles.applyButtonText}>
              {applying
                ? "Applying..."
                : isApplied
                ? `Applied (${nbProposals} proposals left)`
                : `Apply (${nbProposals} proposals left)`}
            </Text>
          </Pressable>

          {nbProposals <= 0 && (
            <Text style={styles.noProposalsText}>
              You've used all your proposals for this period
            </Text>
          )}
        </View>

        {/* Recruiters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#7c4dff" />
              <Text style={styles.loadingText}>Loading team members...</Text>
            </View>
          ) : (
            <View style={styles.recruitersContainer}>
              {recruiters.map((recruiter, index) => (
                <View key={index} style={styles.recruiterCard}>
                  <View style={styles.recruiterInfo}>
                    <View style={styles.recruiterAvatar}>
                      <MaterialCommunityIcons
                        name="account"
                        size={20}
                        color="#7c4dff"
                      />
                    </View>
                    <View style={styles.recruiterDetails}>
                      <Text style={styles.recruiterName}>
                        {recruiter.position_title}
                      </Text>
                      <Text style={styles.recruiterCompany}>
                        {recruiter.company?.name}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.messageButton}
                    onPress={() => handleMessage(recruiter)}
                  >
                    <MaterialCommunityIcons
                      name="message"
                      size={16}
                      color="#7c4dff"
                    />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={messageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMessageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Message {selectedRecruiter?.position_title}
                {selectedRecruiter?.company?.name}
              </Text>
              <Pressable onPress={closeMessageModal}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#fafafa"
                />
              </Pressable>
            </View>

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#bdbdbd"
              multiline
              value={messageText}
              onChangeText={setMessageText}
              maxLength={255}
              textAlignVertical="top"
            />

            <View style={styles.inputFooter}>
              <Text style={styles.charCounter}>{messageText.length}/255</Text>
            </View>

            <View style={styles.modalButtons}>
              

              <Pressable
                style={[styles.modalButton, styles.sendButton, (messageText.trim().length < 1 || messageText.length > 255) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={messageText.trim().length < 1 || messageText.length > 255}
              >
                <MaterialCommunityIcons name="send" size={16} color="#fff" />
                <Text style={styles.sendButtonText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fafafa",
    marginBottom: 12,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  companySection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  companyText: {
    fontSize: 16,
    color: "#cfcfba",
    marginLeft: 6,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: "#bdbdbd",
    fontSize: 12,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#cfcfba",
    lineHeight: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  detailLabel: {
    fontSize: 12,
    color: "#bdbdbd",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#fafafa",
    fontWeight: "500",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "#ede7f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: {
    color: "#7c4dff",
    fontWeight: "700",
    fontSize: 12,
  },
  applyButton: {
    backgroundColor: "#7c4dff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  applyButtonTextDisabled: {
    backgroundColor: "#666",
    color: "#aaa",
  },
  noProposalsText: {
    color: "#f44336",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#bdbdbd",
    marginLeft: 8,
    fontSize: 14,
  },
  recruitersContainer: {
    gap: 12,
  },
  recruiterCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recruiterInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recruiterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recruiterDetails: {
    flex: 1,
  },
  recruiterName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fafafa",
    marginBottom: 2,
  },
  recruiterCompany: {
    fontSize: 12,
    color: "#bdbdbd",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageButtonText: {
    color: "#7c4dff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  candidatesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  candidatesText: {
    fontSize: 12,
    color: "#7c4dff",
    marginLeft: 4,
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fafafa",
    flex: 1,
    marginRight: 10,
  },
  messageInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#fafafa",
    fontSize: 14,
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },
  inputFooter: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  charCounter: {
    fontSize: 12,
    color: "#bdbdbd",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sendButton: {
    backgroundColor: "#7c4dff",
  },
  cancelButtonText: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Toast styles
  toast: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: "#4caf50",
  },
  toastError: {
    backgroundColor: "#f44336",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(124, 77, 255, 0.2)",
  },
});
