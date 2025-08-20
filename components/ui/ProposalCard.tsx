import type { Proposal } from "@/types/entities";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  proposal: Proposal;
  onPress: (proposal: Proposal) => void;
  onLongPress: (proposal: Proposal) => void;
};

export default function ProposalCard({ proposal, onPress, onLongPress }: Props) {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    setExpanded(!expanded);
    onPress(proposal);
  };

  const getStatusColor = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'interview': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      onLongPress={() => onLongPress(proposal)}
      android_ripple={{ color: '#f3f4f6' }}
    >
      <View style={styles.header}>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{proposal.user.name}</Text>
          <Text style={styles.jobTitle}>{proposal.candidate?.job_title || 'N/A'}</Text>
          {proposal.matched_score && (
            <Text style={styles.matchScore}>
              Match: {Math.round(proposal.matched_score)}%
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(proposal.status.name) }]}>
          <Text style={styles.statusText}>{proposal.status.name}</Text>
        </View>
      </View>

      <View style={styles.metaInfo}>
        <Text style={styles.appliedDate}>
          Applied: {new Date(proposal.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.email}>{proposal.user.email}</Text>
      </View>

      {expanded && proposal.candidate && (
        <View style={styles.expandedContent}>
          {proposal.candidate.skills && proposal.candidate.skills.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Skills:</Text>
              <View style={styles.skillsContainer}>
                {proposal.candidate.skills.map((skill) => (
                  <View key={skill.id} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          {proposal.candidate.experiences.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Latest Experience:</Text>
              <Text style={styles.experienceText}>
                {proposal.candidate.experiences[0].job_title} at{' '}
                {proposal.candidate.experiences[0].company?.name || 'Unknown Company'}
              </Text>
            </>
          )}
          
          {proposal.candidate.projects.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Recent Project:</Text>
              <Text style={styles.projectText}>{proposal.candidate.projects[0].name}</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  email: {
    fontSize: 12,
    color: '#6b7280',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  matchScore: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#374151',
  },
  experienceText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  projectText: {
    fontSize: 13,
    color: '#4b5563',
  },
});