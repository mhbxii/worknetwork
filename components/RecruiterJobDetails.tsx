import { supabase } from "@/lib/supabase";
import { useJobStore } from "@/store/useJobStore";
import { useMetaStore } from "@/store/useMetaStore";
import { Job, MetaOption } from "@/types/entities";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

interface RecruiterJobDetailsProps {
  job: Job;
}

export const RecruiterJobDetails: React.FC<RecruiterJobDetailsProps> = ({
  job,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Job>({ ...job });
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const { statusOptions, categoryOptions, DbSkills } = useMetaStore.getState();
  const [skillQuery, setSkillQuery] = useState("");
  const [allSkills, setAllSkills] = useState<MetaOption[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const { updateJob } = useJobStore();

  // Search handler
  const handleSearchSkills = (newPrompt: string) => {
    setSkillQuery(newPrompt);
    if (!newPrompt.length) {
      setAllSkills([]);
      return;
    }

    const query = newPrompt.toLowerCase();
    const prefixMatches = DbSkills.filter((skill) =>
      skill.name.toLowerCase().startsWith(query)
    );
    const substringMatches = DbSkills.filter(
      (skill) =>
        !skill.name.toLowerCase().startsWith(query) &&
        skill.name.toLowerCase().includes(query)
    );
    const combinedMatches = [...prefixMatches, ...substringMatches].slice(0, 3);

    setAllSkills(combinedMatches);
  };

  // Add skill by ID
  const addSkill = (skill: MetaOption) => {
    if (!editedJob.skills?.includes(skill)) {
      setEditedJob({
        ...editedJob,
        skills: [...(editedJob.skills || []), skill],
      });
    }
    setSkillQuery("");
    //setAllSkills([]);
  };

  // Remove skill by ID
  const removeSkill = (skill: MetaOption) => {
    setEditedJob({
      ...editedJob,
      skills:
        editedJob.skills?.filter((currSkill) => currSkill !== skill) || [],
    });
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
  
      // Map name → ID
      const statusId = statusOptions.find(
        (s) => s.name === editedJob.status.name
      )?.id;
      const categoryId = categoryOptions.find(
        (c) => c.name === editedJob.category.name
      )?.id;
  
      if (!statusId || !categoryId) {
        throw new Error("Invalid status or category selection");
      }
  
      const { error } = await supabase
        .from("jobs")
        .update({
          title: editedJob.title,
          description: editedJob.description,
          status_id: statusId,
          job_category_id: categoryId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedJob.id);
  
      if (error) throw error;
  
      // Fetch current skills from DB
      const { data: currentSkills, error: fetchError } = await supabase
        .from("job_skills")
        .select("skill_id")
        .eq("job_id", editedJob.id);
  
      if (fetchError) throw fetchError;
  
      const currentSkillIds = currentSkills.map((s) => s.skill_id);
      const newSkillIds = editedJob.skills?.map((s) => s.id);
  
      // Figure out differences
      const skillsToAdd = newSkillIds?.filter(
        (id) => !currentSkillIds.includes(id)
      );
      const skillsToRemove = currentSkillIds.filter(
        (id) => !newSkillIds?.includes(id)
      );
  
      // Add new skills
      if (skillsToAdd?.length) {
        const { error: addError } = await supabase.from("job_skills").insert(
          skillsToAdd.map((id) => ({
            job_id: editedJob.id,
            skill_id: id,
          }))
        );
        if (addError) throw addError;
      }
  
      // Remove old skills
      if (skillsToRemove.length) {
        const { error: removeError } = await supabase
          .from("job_skills")
          .delete()
          .eq("job_id", editedJob.id)
          .in("skill_id", skillsToRemove);
        if (removeError) throw removeError;
      }
  
      // Update job in store
      updateJob(editedJob.id, {
        title: editedJob.title,
        description: editedJob.description,
        status: editedJob.status,
        category: editedJob.category,
        skills: editedJob.skills,
      });
  
      setIsEditing(false);
      alert("Job updated successfully!");
    } catch (err) {
      console.error("Error updating job:", err);
      alert("Failed to update job.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedJob({ ...job });
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        {isEditing ? (
          <>
            <Text style={styles.fieldLabel}>Job Title</Text>
            <TextInput
              style={[styles.textInput]}
              value={editedJob.title}
              onChangeText={(text) =>
                setEditedJob({ ...editedJob, title: text })
              }
              placeholder="Enter job title..."
              placeholderTextColor="#666"
            />
          </>
        ) : (
          <Text style={styles.title} numberOfLines={2}>
            {editedJob.title}
          </Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.companySection}>
            <MaterialCommunityIcons name="domain" size={16} color="#cfcfba" />
            <Text style={styles.companyText}>{editedJob.company.name}</Text>
          </View>

          {isEditing ? (
            <Pressable
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(editedJob.status.name) },
              ]}
              onPress={() => setShowStatusModal(true)}
            >
              <MaterialCommunityIcons
                name={
                  editedJob.status.name?.toLowerCase() === "open"
                    ? "briefcase-check"
                    : "briefcase"
                }
                size={12}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {editedJob.status.name?.toUpperCase() || "OPEN"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={12}
                color="#fff"
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(editedJob.status.name) },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  editedJob.status.name?.toLowerCase() === "open"
                    ? "briefcase-check"
                    : "briefcase"
                }
                size={12}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {editedJob.status.name?.toUpperCase() || "OPEN"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar" size={14} color="#bdbdbd" />
          <Text style={styles.dateText}>
            Posted {formatDate(editedJob.created_at)}
          </Text>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        {isEditing ? (
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={editedJob.description || ""}
            onChangeText={(text) =>
              setEditedJob({ ...editedJob, description: text })
            }
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
                <Text style={styles.detailValue}>
                  {editedJob.category.name}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={16}
                  color="#cfcfba"
                />
              </View>
            </Pressable>
          ) : (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{editedJob.category.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Skills Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Required Skills ({editedJob.skills?.length || 0})
        </Text>

        {isEditing && (
          <>
            <TextInput
              style={styles.skillInput}
              placeholder="Search skills..."
              placeholderTextColor="#888"
              value={skillQuery}
              onChangeText={handleSearchSkills}
            />

            {loadingSkills && (
              <ActivityIndicator
                color="#7c4dff"
                style={{ marginVertical: 8 }}
              />
            )}

            {allSkills.length > 0 && skillQuery.length > 0 && (
              <View style={styles.skillSuggestions}>
                {allSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill.id}
                    onPress={() => addSkill(skill)}
                    style={styles.suggestionButton}
                  >
                    <Text style={styles.suggestionText}>{skill.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        {/*skill chips*/}
        <View style={styles.skillsContainer}>
          {editedJob.skills?.map((editedJobskill) => {
            const skill = DbSkills.find((s) => s.id === editedJobskill.id);
            return (
              <View key={editedJobskill.id} style={styles.skillChip}>
                <Text style={styles.skillText}>
                  {skill?.name || `Skill #${editedJobskill.id}`}
                </Text>
                {isEditing && (
                  <Pressable
                    onPress={() => removeSkill(editedJobskill)}
                    style={styles.removeSkillButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={12}
                      color="#7c4dff"
                    />
                  </Pressable>
                )}
              </View>
            );
          })}
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
              <Text style={[styles.actionButtonText, { color: "#f44336" }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons
                  name="content-save"
                  size={20}
                  color="#fff"
                />
              )}
              <Text style={[styles.actionButtonText, { color: "#fff" }]}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>
              Edit Job
            </Text>
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
            {statusOptions.map((status) => (
              <Pressable
                key={status.id}
                style={[
                  styles.modalOption,
                  editedJob.status.name === status.name &&
                    styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setEditedJob({ ...editedJob, status: status });
                  setShowStatusModal(false);
                }}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status.name) },
                  ]}
                />
                <Text
                  style={[
                    styles.modalOptionText,
                    editedJob.status.name === status.name &&
                      styles.modalOptionTextSelected,
                  ]}
                >
                  {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
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
            {categoryOptions.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.modalOption,
                  editedJob.category.name === category.name &&
                    styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setEditedJob({ ...editedJob, category: category });
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    editedJob.category.name === category.name &&
                      styles.modalOptionTextSelected,
                  ]}
                >
                  {category.name}
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
    marginBottom: 15,
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

  skillSuggestions: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 4,
    overflow: "hidden",
  },

  suggestionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },

  suggestionText: {
    color: "#fff",
    fontSize: 14,
  },

  // Optional: Remove bottom border for last suggestion
  suggestionButtonLast: {
    borderBottomWidth: 0,
  },
});
