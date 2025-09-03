import CategorySelector from "@/components/ui/JobCategorySelector";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { useMetaStore } from "@/store/useMetaStore";
import {
  CandidateProfile,
  MetaOption,
  RecruiterProfile,
} from "@/types/entities";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  IconButton,
  Surface,
  Text
} from "react-native-paper";

export default function ViewEditProfile() {
  const navigation = useNavigation();
  const { user, profile, setProfile } = useAuth();
  const { categoryOptions, DbSkills } = useMetaStore.getState();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  //const [loadingSkills, setLoadingSkills] = useState(false);

  // Form state for candidate
  const [candidateForm, setCandidateForm] = useState<CandidateProfile>({
    job_title: "",
    experiences: [],
    projects: [],
    skills: null,
    job_category: null,
    nb_proposals: null,
  });

  // Form state for recruiter
  const [recruiterForm, setRecruiterForm] = useState<RecruiterProfile>({
    company: null,
    position_title: "",
  });

  // Skills search
  const [allSkills, setAllSkills] = useState<MetaOption[]>([]);
  const [skillQuery, setSkillQuery] = useState("");

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      if ("job_title" in profile) {
        // Candidate profile
        setCandidateForm(profile as CandidateProfile);
      } else {
        // Recruiter profile
        setRecruiterForm(profile as RecruiterProfile);
      }
    }
  }, [profile]);

  const isCandidate = profile && "job_title" in profile;
  const isRecruiter = profile && "company" in profile;

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

  // Candidate handlers
  const updateExperience = useCallback(
    (index: number, field: string, value: any) => {
      const updated = [...candidateForm.experiences];
      updated[index] = { ...updated[index], [field]: value };
      setCandidateForm({ ...candidateForm, experiences: updated });
    },
    [candidateForm]
  );

  const addExperience = useCallback(() => {
    if (candidateForm.experiences.length >= 5) return;
    setCandidateForm({
      ...candidateForm,
      experiences: [
        ...candidateForm.experiences,
        {
          company: null,
          job_title: "",
          start_date: "",
          end_date: "",
        },
      ],
    });
  }, [candidateForm]);

  const removeExperience = useCallback(
    (index: number) => {
      const updated = candidateForm.experiences.filter((_, i) => i !== index);
      setCandidateForm({ ...candidateForm, experiences: updated });
    },
    [candidateForm]
  );

  const updateProject = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...candidateForm.projects];
      updated[index] = { ...updated[index], [field]: value };
      setCandidateForm({ ...candidateForm, projects: updated });
    },
    [candidateForm]
  );

  const addProject = useCallback(() => {
    if (candidateForm.projects.length >= 5) return;
    setCandidateForm({
      ...candidateForm,
      projects: [
        ...candidateForm.projects,
        { name: "", description: "", start_date: "", end_date: "" },
      ],
    });
  }, [candidateForm]);

  const removeProject = useCallback(
    (index: number) => {
      const updated = candidateForm.projects.filter((_, i) => i !== index);
      setCandidateForm({ ...candidateForm, projects: updated });
    },
    [candidateForm]
  );

  const addSkill = useCallback(
    (skill: MetaOption) => {
      if (
        candidateForm.skills &&
        !candidateForm.skills.includes(skill) &&
        candidateForm.skills.length < 15
      ) {
        setCandidateForm({
          ...candidateForm,
          skills: [...candidateForm.skills, skill],
        });
      }
    },
    [candidateForm]
  );

  const removeSkill = useCallback(
    (skill: MetaOption) => {
      setCandidateForm({
        ...candidateForm,
        skills: candidateForm.skills?.filter((s) => s !== skill) || null,
      });
    },
    [candidateForm]
  );

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User not found");
      return;
    }

    setIsSaving(true);

    try {
      if (isCandidate) {
        // Save candidate profile
        const { error: candidateError } = await supabase
          .from("candidates")
          .update({
            job_title: candidateForm.job_title || null,
            job_category_id: candidateForm.job_category?.id || null,
          })
          .eq("user_id", user.id);

        if (candidateError) throw candidateError;

        // Update skills, projects, experiences
        // For now, we'll just update the store optimistically
        setProfile(candidateForm);
      } else if (isRecruiter) {
        // Save recruiter profile
        const { error: recruiterError } = await supabase
          .from("hrs")
          .update({
            position_title: recruiterForm.position_title || null,
            company_id: recruiterForm.company?.id || null,
          })
          .eq("user_id", user.id);

        if (recruiterError) throw recruiterError;

        setProfile(recruiterForm);
      }

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditMode(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      if ("job_title" in profile) {
        setCandidateForm(profile as CandidateProfile);
      } else {
        setRecruiterForm(profile as RecruiterProfile);
      }
    }
    setIsEditMode(false);
  };

   // keep handlers (handleSave, handleCancel) in scope — they already exist
   useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: "#1a1a2e",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
      },
      headerTintColor: "#fff",
      headerTitle: isEditMode ? "Edit Profile" : "View Profile",
      headerLeft: () => (
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : router.back())}
        />
      ),
      headerRight: () =>
        isEditMode ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button
              mode="text"
              onPress={handleCancel}
              textColor="rgba(255,255,255,0.7)"
              disabled={isSaving}
              compact
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              style={styles.saveButton}
              compact
            >
              Save
            </Button>
          </View>
        ) : (
          <IconButton
            icon="pencil"
            iconColor="#fff"
            size={24}
            onPress={() => setIsEditMode(true)}
          />
        ),
    });
  }, [navigation, isEditMode, isSaving, handleCancel, handleSave, setIsEditMode]);

  if (!profile) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No profile data found</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isCandidate ? (
            // Candidate Profile
            <>
              {/* Job Category */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Field of Expertise</Text>
                {isEditMode ? (
                  <CategorySelector
                    categories={categoryOptions}
                    selectedValue={candidateForm.job_category?.id || null}
                    onSelect={(value) =>
                      setCandidateForm({
                        ...candidateForm,
                        job_category: value
                          ? {
                              id: value,
                              name:
                                categoryOptions.find((cat) => cat.id === value)
                                  ?.name || "",
                            }
                          : null,
                      })
                    }
                  />
                ) : (
                  <Text style={styles.displayText}>
                    {candidateForm.job_category?.name || "Not specified"}
                  </Text>
                )}
              </Surface>

              {/* Job Title */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Job Title</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Your Job Title"
                    placeholderTextColor="#888"
                    value={candidateForm.job_title}
                    onChangeText={(text) =>
                      setCandidateForm({ ...candidateForm, job_title: text })
                    }
                  />
                ) : (
                  <Text style={styles.displayText}>
                    {candidateForm.job_title || "Not specified"}
                  </Text>
                )}
              </Surface>

              {/* Experience Section */}
              <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Professional Experience ({candidateForm.experiences.length})
                  </Text>
                  {isEditMode && (
                    <IconButton
                      icon="plus"
                      size={24}
                      iconColor="#fff"
                      onPress={addExperience}
                      disabled={candidateForm.experiences.length >= 5}
                    />
                  )}
                </View>
                {candidateForm.experiences.length === 0 ? (
                  <Text style={styles.emptyText}>No experience added</Text>
                ) : (
                  candidateForm.experiences.map((exp, index) => (
                    <Surface key={index} style={styles.itemCard} elevation={1}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>
                          Experience #{index + 1}
                        </Text>
                        {isEditMode && (
                          <IconButton
                            icon="close"
                            size={20}
                            iconColor="#fff"
                            onPress={() => removeExperience(index)}
                          />
                        )}
                      </View>

                      {isEditMode ? (
                        <>
                          <TextInput
                            style={styles.input}
                            placeholder="Company Name"
                            placeholderTextColor="#888"
                            value={exp.company?.name || ""}
                            onChangeText={(text) =>
                              updateExperience(index, "company", { name: text })
                            }
                          />
                          <TextInput
                            style={styles.input}
                            placeholder="Job Title"
                            placeholderTextColor="#888"
                            value={exp.job_title}
                            onChangeText={(text) =>
                              updateExperience(index, "job_title", text)
                            }
                          />
                          <View style={styles.dateRow}>
                            <TextInput
                              style={[styles.input, styles.dateInput]}
                              placeholder="Start Date"
                              placeholderTextColor="#888"
                              value={exp.start_date || ""}
                              onChangeText={(text) =>
                                updateExperience(index, "start_date", text)
                              }
                            />
                            <TextInput
                              style={[styles.input, styles.dateInput]}
                              placeholder="End Date"
                              placeholderTextColor="#888"
                              value={exp.end_date || ""}
                              onChangeText={(text) =>
                                updateExperience(index, "end_date", text)
                              }
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.displayText}>
                            <Text style={styles.displayLabel}>Company: </Text>
                            {exp.company?.name || "Not specified"}
                          </Text>
                          <Text style={styles.displayText}>
                            <Text style={styles.displayLabel}>Position: </Text>
                            {exp.job_title || "Not specified"}
                          </Text>
                          <Text style={styles.displayText}>
                            <Text style={styles.displayLabel}>Duration: </Text>
                            {exp.start_date || "N/A"} -{" "}
                            {exp.end_date || "Present"}
                          </Text>
                        </>
                      )}
                    </Surface>
                  ))
                )}
              </Surface>

              {/* Skills Section */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>
                  Skills ({candidateForm.skills?.length || 0})
                </Text>

                {isEditMode && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Search skills..."
                      placeholderTextColor="#888"
                      value={skillQuery}
                      onChangeText={handleSearchSkills}
                    />

                    {allSkills.length > 0 && (
                      <View style={styles.skillSuggestions}>
                        {allSkills.map((skill) => (
                          <TouchableOpacity
                            key={skill.id}
                            onPress={() => addSkill(skill)}
                            style={styles.suggestionButton}
                          >
                            <Text style={styles.suggestionText}>
                              {skill.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

                <View style={styles.skillChips}>
                  {candidateForm.skills?.map((skill) => (
                    <TouchableOpacity
                      key={skill.id}
                      onPress={
                        isEditMode ? () => removeSkill(skill) : undefined
                      }
                      style={[
                        styles.skillChip,
                        isEditMode && styles.skillChipEditable,
                      ]}
                    >
                      <Text style={styles.skillText}>{skill.name}</Text>
                      {isEditMode && (
                        <MaterialCommunityIcons
                          name="close"
                          size={16}
                          color="#fff"
                          style={styles.closeIcon}
                        />
                      )}
                    </TouchableOpacity>
                  )) || <Text style={styles.emptyText}>No skills added</Text>}
                </View>
              </Surface>
            </>
          ) : (
            // Recruiter Profile
            <>
              {/* Company */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Company</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Company Name"
                    placeholderTextColor="#888"
                    value={recruiterForm.company?.name || ""}
                    onChangeText={(text) =>
                      setRecruiterForm({
                        ...recruiterForm,
                        company: { id: 0, name: text },
                      })
                    }
                  />
                ) : (
                  <Text style={styles.displayText}>
                    {recruiterForm.company?.name || "Not specified"}
                  </Text>
                )}
              </Surface>

              {/* Position Title */}
              <Surface style={styles.section} elevation={1}>
                <Text style={styles.sectionTitle}>Position Title</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.input}
                    placeholder="Your Position Title"
                    placeholderTextColor="#888"
                    value={recruiterForm.position_title}
                    onChangeText={(text) =>
                      setRecruiterForm({
                        ...recruiterForm,
                        position_title: text,
                      })
                    }
                  />
                ) : (
                  <Text style={styles.displayText}>
                    {recruiterForm.position_title || "Not specified"}
                  </Text>
                )}
              </Surface>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    borderRadius: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  displayText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  displayLabel: {
    fontWeight: "600",
    color: "#fff",
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 48,
  },
  itemCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  skillSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    color: "#fff",
    fontSize: 14,
  },
  skillChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    backgroundColor: "rgba(135,206,250,0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  skillChipEditable: {
    backgroundColor: "rgba(255,100,100,0.4)",
  },
  skillText: {
    color: "#fff",
    fontSize: 14,
  },
  closeIcon: {
    marginLeft: 4,
  },
});
