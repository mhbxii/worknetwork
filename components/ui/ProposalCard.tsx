import type { Proposal } from "@/types/entities";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  proposal: Proposal;
  onPress: (proposal: Proposal) => void;
  onLongPress: (proposal: Proposal) => void;
};

export default function ProposalCard({ proposal, onPress, onLongPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
    onPress(proposal);
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "interview":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const animatedStyle = {
    maxHeight: animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 300], // adjust max height
    }),
    opacity: animatedHeight,
  };

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      onLongPress={() => onLongPress(proposal)}
      android_ripple={{ color: "#f3f4f6" }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{proposal.user.name}</Text>
          <Text style={styles.jobTitle}>
            {proposal.candidate?.job_title || "No job title"}
          </Text>
          {proposal.matched_score && (
            <Text style={styles.matchScore}>
              Match: {proposal.matched_score}/10
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(proposal.status.name) },
          ]}
        >
          <Text style={styles.statusText}>{proposal.status.name}</Text>
        </View>
      </View>

      {/* META INFO */}
      <View style={styles.metaInfo}>
        <Text style={styles.appliedDate}>
          Applied: {new Date(proposal.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.email}>{proposal.user.email}</Text>
      </View>

      {/* EXPANDABLE CONTENT */}
      <Animated.View style={[styles.expandedContent, { overflow: "hidden" }, animatedStyle]}>
        {proposal.candidate && (
          <View>
            {/* SKILLS */}
            <Text style={styles.sectionLabel}>Skills</Text>
            {proposal.candidate.skills && proposal.candidate.skills.length > 0 ? (
              <View style={styles.skillsContainer}>
                {proposal.candidate.skills.map((skill) => (
                  <View key={skill.id} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState icon="code" text="No skills provided" />
            )}

            {/* EXPERIENCE */}
            <Text style={styles.sectionLabel}>Experience</Text>
            {proposal.candidate.experiences.length > 0 ? (
              <Text style={styles.experienceText}>
                {proposal.candidate.experiences[0].job_title} at{" "}
                {proposal.candidate.experiences[0].company?.name ||
                  "Unknown Company"}
              </Text>
            ) : (
              <EmptyState icon="work-outline" text="No experience yet" />
            )}

            {/* PROJECTS */}
            <Text style={styles.sectionLabel}>Projects</Text>
            {proposal.candidate.projects.length > 0 ? (
              <Text style={styles.projectText}>
                {proposal.candidate.projects[0].name}
              </Text>
            ) : (
              <EmptyState icon="folder-open" text="No projects added" />
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ✅ Empty State Component with Icon
const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.emptyState}>
    <MaterialIcons name={icon as any} size={16} color="#9ca3af" />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 8,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  appliedDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  email: {
    fontSize: 12,
    color: "#6b7280",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  matchScore: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 8,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  skillBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: "#374151",
  },
  experienceText: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 8,
  },
  projectText: {
    fontSize: 13,
    color: "#4b5563",
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    marginLeft: 6,
  },
});
