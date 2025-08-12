import { Job } from "@/types/entities";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from "react";
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

interface RecruiterJobDetailsProps {
  job: Job;
}

const STATUS_OPTIONS = ['open', 'closed', 'paused'];
const CATEGORY_OPTIONS = ['Engineering', 'Marketing', 'Design', 'Sales', 'HR', 'Operations'];

export const RecruiterJobDetails: React.FC<RecruiterJobDetailsProps> = ({ job }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Job>({ ...job });
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');

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

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    alert('Job updated successfully!');
  };

  const handleCancel = () => {
    setEditedJob({ ...job });
    setIsEditing(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !editedJob.skills?.includes(newSkill.trim())) {
      setEditedJob({
        ...editedJob,
        skills: [...(editedJob.skills || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditedJob({
      ...editedJob,
      skills: editedJob.skills?.filter(skill => skill !== skillToRemove)
    });
  };

  const EditableField = ({ 
    label, 
    value, 
    onChangeText, 
    multiline = false, 
    placeholder = "" 
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    placeholder?: string;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#666"
      />
    </View>
  );

  const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.readOnlyField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        {isEditing ? (
          <EditableField
            label="Job Title"
            value={editedJob.title}
            onChangeText={(text) => setEditedJob({ ...editedJob, title: text })}
            placeholder="Enter job title..."
          />
        ) : (
          <Text style={styles.title} numberOfLines={2}>
            {editedJob.title}
          </Text>
        )}
        
        <View style={styles.metaRow}>
          <View style={styles.companySection}>
            <MaterialCommunityIcons name="domain" size={16} color="#cfcfba" />
            <Text style={styles.companyText}>{editedJob.company_name}</Text>
          </View>
          
          {isEditing ? (
            <Pressable 
              style={[styles.statusBadge, { backgroundColor: getStatusColor(editedJob.status) }]}
              onPress={() => setShowStatusModal(true)}
            >
              <MaterialCommunityIcons
                name={editedJob.status?.toLowerCase() === "open" ? "briefcase-check" : "briefcase"}
                size={12}
                color="#fff"
              />
              <Text style={styles.statusText}>{editedJob.status?.toUpperCase() || 'OPEN'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color="#fff" />
            </Pressable>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(editedJob.status) }]}>
              <MaterialCommunityIcons
                name={editedJob.status?.toLowerCase() === "open" ? "briefcase-check" : "briefcase"}
                size={12}
                color="#fff"
              />
              <Text style={styles.statusText}>{editedJob.status?.toUpperCase() || 'OPEN'}</Text>
            </View>
          )}
        </View>

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={14} color="#bdbdbd" />
          <Text style={styles.dateText}>Posted {formatDate(editedJob.created_at)}</Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        {isEditing ? (
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={editedJob.description || ''}
            onChangeText={(text) => setEditedJob({ ...editedJob, description: text })}
            multiline
            placeholder="Enter job description..."
            placeholderTextColor="#666"
          />
        ) : (
          <Text style={styles.description}>
            {editedJob.description || "No description provided."}
          </Text>
        )}
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsGrid}>
          {isEditing ? (
            <Pressable 
              style={styles.detailItem}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.detailLabel}>Category</Text>
              <View style={styles.selectableField}>
                <Text style={styles.detailValue}>{editedJob.category_name}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="#cfcfba" />
              </View>
            </Pressable>
          ) : (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{editedJob.category_name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Skills Section */}
      <View style={styles.section}>
        <View style={styles.skillsHeader}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          {isEditing && (
            <Pressable onPress={addSkill} style={styles.addSkillButton}>
              <MaterialCommunityIcons name="plus" size={16} color="#7c4dff" />
            </Pressable>
          )}
        </View>
        
        {isEditing && (
          <View style={styles.skillInputContainer}>
            <TextInput
              style={styles.skillInput}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add a skill..."
              placeholderTextColor="#666"
              onSubmitEditing={addSkill}
            />
          </View>
        )}

        <View style={styles.skillsContainer}>
          {editedJob.skills?.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
              {isEditing && (
                <Pressable onPress={() => removeSkill(skill)} style={styles.removeSkillButton}>
                  <MaterialCommunityIcons name="close" size={12} color="#7c4dff" />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Action Section */}
      <View style={styles.section}>
        {isEditing ? (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <MaterialCommunityIcons name="close" size={20} color="#f44336" />
              <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
              )}
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Edit Job</Text>
          </Pressable>
        )}
      </View>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Status</Text>
            {STATUS_OPTIONS.map(status => (
              <Pressable
                key={status}
                style={[
                  styles.modalOption,
                  editedJob.status === status && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setEditedJob({ ...editedJob, status });
                  setShowStatusModal(false);
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[
                  styles.modalOptionText,
                  editedJob.status === status && styles.modalOptionTextSelected
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            {CATEGORY_OPTIONS.map(category => (
              <Pressable
                key={category}
                style={[
                  styles.modalOption,
                  editedJob.category_name === category && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setEditedJob({ ...editedJob, category_name: category });
                  setShowCategoryModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  editedJob.category_name === category && styles.modalOptionTextSelected
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
    marginRight: 4,
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
  selectableField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addSkillButton: {
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  skillInputContainer: {
    marginBottom: 12,
  },
  skillInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    color: "#fafafa",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    flexDirection: "row",
    alignItems: "center",
  },
  skillText: {
    color: "#7c4dff",
    fontWeight: "700",
    fontSize: 12,
  },
  removeSkillButton: {
    marginLeft: 6,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#bdbdbd",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: "#fafafa",
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    color: "#fafafa",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textInputMultiline: {
    height: 100,
    textAlignVertical: "top",
  },
  readOnlyField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButton: {
    backgroundColor: "#7c4dff",
    shadowColor: "#7c4dff",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    shadowColor: "#4caf50",
  },
  cancelButton: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderWidth: 1,
    borderColor: "#f44336",
    shadowColor: "#f44336",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1e1e2e",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 300,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(124, 77, 255, 0.2)",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#cfcfba",
    marginLeft: 12,
  },
  modalOptionTextSelected: {
    color: "#7c4dff",
    fontWeight: "600",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});