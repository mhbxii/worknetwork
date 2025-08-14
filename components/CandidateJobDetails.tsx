import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { Job, RecruiterProfile } from "@/types/entities";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface CandidateJobDetailsProps {
  job: Job;
}

export const CandidateJobDetails: React.FC<CandidateJobDetailsProps> = ({
  job,
}) => {
  const { profile, user, setProfile } = useAuth();
  const [nbProposals, setNbProposals] = useState("nb_proposals" in profile! ? profile.nb_proposals ?? 0 : 0);
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    // Check if user has already applied for this job
    async function checkApplication() {
      try {
        const { data, error } = await supabase
          .from("job_applications")
          .select("id")
          .eq("job_id", job.id)
          .eq("candidate_id", user!.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking application:", error);
        } else {
          setIsApplied(!!data);
        }
      } catch (err) {
        console.error("Unexpected error checking application:", err);
      }
    }

    checkApplication();
  }, []);

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

    try {
      const { error } = await supabase
        .from("job_applications")
        .insert({
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
      }
    } catch (err) {
      console.error("Unexpected error applying for job:", err);
      alert("An unexpected error occurred. Please try again later.");
    }
  }

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
            (nbProposals <= 0 || isApplied) && styles.applyButtonDisabled,
          ]}
          disabled={nbProposals <= 0}
          onPress={handleJobApplication}
        >
          {!isApplied && <MaterialCommunityIcons
            name="send"
            size={20}
            color={nbProposals <= 0 ? "#666" : "#fff"}
          />}
          <Text
            style={[
              styles.applyButtonText,
            ]}
          >
            {!isApplied ? <Text>Apply</Text> : <Text>Applied</Text>} ({nbProposals} proposals left)
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
                  onPress={() => alert(`Message ${recruiter.position_title}`)}
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
});
