import { useAuth } from "@/store/authStore";
import { Job, RecruiterProfile } from "@/types/entities";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

interface CandidateJobDetailsProps {
  job: Job;
}

export const CandidateJobDetails: React.FC<CandidateJobDetailsProps> = ({ job }) => {
  const { profile } = useAuth();
  const nbProposals = profile?.role === "candidate" ? profile.data.nb_proposals ?? 0 : 0;
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecruiters() {
      setLoading(true);
      // TODO: Replace with real fetch by job.company_id
      // Mock recruiters:
      await new Promise((r) => setTimeout(r, 500)); // simulate delay
      setRecruiters([
        { company_name: "ACME Inc.", company_id: 1, position_title: "HR Manager" },
        { company_name: "ACME Inc.", company_id: 1, position_title: "Recruiter" },
      ]);
      setLoading(false);
    }
    fetchRecruiters();
  }, [job.company_name]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#4caf50';
      case 'closed': return '#f44336';
      case 'paused': return '#ff9800';
      default: return '#2196f3';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            <Text style={styles.companyText}>{job.company_name}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <MaterialCommunityIcons
              name={job.status?.toLowerCase() === "open" ? "briefcase-check" : "briefcase"}
              size={12}
              color="#fff"
            />
            <Text style={styles.statusText}>{job.status?.toUpperCase() || 'OPEN'}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={14} color="#bdbdbd" />
          <Text style={styles.dateText}>Posted {formatDate(job.created_at)}</Text>
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
            <Text style={styles.detailValue}>{job.category_name}</Text>
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
                <Text style={styles.skillText}>{skill}</Text>
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
            nbProposals <= 0 && styles.applyButtonDisabled
          ]}
          disabled={nbProposals <= 0}
          onPress={() => alert("Apply pressed")}
        >
          <MaterialCommunityIcons 
            name="send" 
            size={20} 
            color={nbProposals <= 0 ? "#666" : "#fff"} 
          />
          <Text style={[
            styles.applyButtonText,
            nbProposals <= 0 && styles.applyButtonTextDisabled
          ]}>
            Apply ({nbProposals} proposals left)
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
                    <MaterialCommunityIcons name="account" size={20} color="#7c4dff" />
                  </View>
                  <View style={styles.recruiterDetails}>
                    <Text style={styles.recruiterName}>{recruiter.position_title}</Text>
                    <Text style={styles.recruiterCompany}>{recruiter.company_name}</Text>
                  </View>
                </View>
                
                <Pressable
                  style={styles.messageButton}
                  onPress={() => alert(`Message ${recruiter.position_title}`)}
                >
                  <MaterialCommunityIcons name="message" size={16} color="#7c4dff" />
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
    backgroundColor: "#444",
    shadowOpacity: 0,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  applyButtonTextDisabled: {
    color: "#666",
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