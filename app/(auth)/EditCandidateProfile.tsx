import CategorySelector from "@/components/ui/JobCategorySelector";
import { useMetaStore } from "@/store/useMetaStore";
import { MetaOption, OnboardingForm } from "@/types/entities";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  HelperText,
  Icon,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";

interface Props {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
  isSubmitting?: boolean;
  setIsSubmitting?: (loading: boolean) => void;
}

export default function EditCandidateProfile({
  form,
  setForm,
  onNext,
  isSubmitting = false,
  setIsSubmitting,
}: Props) {
  const [allSkills, setAllSkills] = useState<MetaOption[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);
  const { categoryOptions, DbSkills } = useMetaStore.getState();
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSkillsInputFocused, setIsSkillsInputFocused] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

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
    const combinedMatches = [...prefixMatches, ...substringMatches].slice(0, 3); // Show top 5
    setAllSkills(combinedMatches);
  };

  // === Experience Handlers ===
  const updateExperience = useCallback(
    (index: number, field: string, value: any) => {
      const updated = [...form.experiences];
      if (field === "company_name") {
        updated[index] = { ...updated[index], company: { id: 0, name: value } };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      setForm({ ...form, experiences: updated });
    },
    [form, setForm]
  );

  const addExperience = useCallback(() => {
    if (form.experiences.length >= 5) return;
    setForm({
      ...form,
      experiences: [
        ...form.experiences,
        {
          company: null,
          job_title: "",
          start_date: "",
          end_date: "",
        },
      ],
    });
  }, [form, setForm]);

  const removeExperience = useCallback(
    (index: number) => {
      const updated = form.experiences.filter((_, i) => i !== index);
      setForm({ ...form, experiences: updated });
    },
    [form, setForm]
  );

  // === Project Handlers ===
  const updateProject = useCallback(
    (index: number, field: string, value: string) => {
      const updated = [...form.projects];
      updated[index] = { ...updated[index], [field]: value };
      setForm({ ...form, projects: updated });
    },
    [form, setForm]
  );

  const addProject = useCallback(() => {
    if (form.projects.length >= 5) return;
    setForm({
      ...form,
      projects: [
        ...form.projects,
        { name: "", description: "", start_date: "", end_date: "" },
      ],
    });
  }, [form, setForm]);

  const removeProject = useCallback(
    (index: number) => {
      const updated = form.projects.filter((_, i) => i !== index);
      setForm({ ...form, projects: updated });
    },
    [form, setForm]
  );

  // === Skill Handlers ===
  const addSkill = useCallback(
    (skill: MetaOption) => {
      if (
        form.skills &&
        !form.skills.includes(skill) &&
        form.skills.length < 15
      ) {
        setForm({ ...form, skills: [...form.skills, skill] });
      }
    },
    [form, setForm]
  );

  const removeSkill = useCallback(
    (skill: MetaOption) => {
      setForm({
        ...form,
        skills: form.skills?.filter((s) => s !== skill) || null,
      });
    },
    [form, setForm]
  );

  const isValidDateFormat = (dateString: string): boolean => {
    // 1. Accept YYYY-M-D or YYYY-MM-DD
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
      return false;
    }

    // 2. Extract numeric components
    const [yStr, mStr, dStr] = dateString.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);

    // 3. Basic range checks
    if (month < 1 || month > 12) {
      return false;
    }

    // 4. Days in this month (UTC avoids timezone drift)
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day < 1 || day > daysInMonth) {
      return false;
    }

    // 5. Rollover sanity check via numeric comparison
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return (
      utcDate.getUTCFullYear() === year &&
      utcDate.getUTCMonth() + 1 === month &&
      utcDate.getUTCDate() === day
    );
  };

  //##########################################################################################################################################
  // Complete validation function
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting?.(true);

    try {
      // 1. Field of Expertise validation
      if (!form.job_category) {
        alert("Please select your field of expertise.");
        return;
      }

      // 2. Job Title validation
      if (!form.job_title || form.job_title.trim().length < 3) {
        alert("Please enter a valid job title (minimum 3 characters).");
        return;
      }

      // 3. Experiences validation (loops through each entry)
      for (let i = 0; i < form.experiences.length; i++) {
        const exp = form.experiences[i];
        const expNum = i + 1;

        if (!exp.company?.name || exp.company.name.trim().length < 2) {
          alert(`Experience #${expNum}: Please enter a valid company name.`);
          return;
        }
        if (!exp.job_title || exp.job_title.trim().length < 3) {
          alert(`Experience #${expNum}: Please enter a valid job title.`);
          return;
        }
        // START DATE VALIDATION (Required + Format)
        if (!exp.start_date || !isValidDateFormat(exp.start_date)) {
          alert(
            `Experience #${expNum}: Please enter a valid start date in YYYY-MM-DD format.`
          );
          return;
        }
        // END DATE VALIDATION (Optional, but must have correct format if present)
        if (exp.end_date && !isValidDateFormat(exp.end_date)) {
          alert(
            `Experience #${expNum}: The end date is invalid. Please use YYYY-MM-DD format or leave it empty.`
          );
          return;
        }
      }

      // 4. Projects validation (loops through each entry)
      for (let i = 0; i < form.projects.length; i++) {
        const project = form.projects[i];
        const projNum = i + 1;

        if (!project.name || project.name.trim().length < 3) {
          alert(`Project #${projNum}: Please enter a valid project name.`);
          return;
        }
        if (!project.description || project.description.trim().length < 10) {
          alert(`Project #${projNum}: Please provide a longer description.`);
          return;
        }
        // START DATE VALIDATION (Required + Format)
        if (!project.start_date || !isValidDateFormat(project.start_date)) {
          alert(
            `Project #${projNum}: Please enter a valid start date in YYYY-MM-DD format.`
          );
          return;
        }
        // END DATE VALIDATION (Optional, but must have correct format if present)
        if (project.end_date && !isValidDateFormat(project.end_date)) {
          alert(
            `Project #${projNum}: The end date is invalid. Please use YYYY-MM-DD format or leave it empty.`
          );
          return;
        }
      }

      // 5. Skills validation
      if (!form.skills || form.skills.length < 3) {
        alert("Please add at least 3 skills to your profile.");
        return;
      }

      // All validation passed
      //alert("All validations passed! Ready to proceed.");
      // console.log("Form is valid:", form);
      onNext(); // You can uncomment this to move to the next step
    } finally {
      setIsSubmitting?.(false); // Ensures the button is re-enabled even if validation fails
    }
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          // style={{
          //   transform: [
          //     {
          //       translateY:
          //         keyboardHeight > 0 && isSkillsInputFocused
          //           ? -keyboardHeight
          //           : 0,
          //     },
          //   ],
          // }}
        >
          {/* Header */}
          <Text style={styles.title}>Edit Your Profile</Text>

          {/* Field of Expertise */}
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionTitle}>Field of Expertise:</Text>

            {loadingCategories ? (
              <ActivityIndicator
                animating={true}
                size="small"
                style={{ marginTop: 10 }}
              />
            ) : (
              <CategorySelector
                categories={categoryOptions}
                selectedValue={form.job_category?.id || null}
                onSelect={(value) =>
                  setForm({
                    ...form,
                    job_category: value
                      ? {
                          id: value,
                          name:
                            categoryOptions.find(
                              (category) => category.id === value
                            )?.name || "",
                        }
                      : null,
                  })
                }
              />
            )}

            {!form.job_category && (
              <HelperText type="info">
                Please select your field of expertise
              </HelperText>
            )}
          </Surface>

          {/* Job Title Section */}
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionTitle}>Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Job Title"
              placeholderTextColor="#888"
              value={form.job_title}
              onChangeText={(text) => setForm({ ...form, job_title: text })}
            />
          </Surface>

          {/* Experiences Section */}
          <Surface style={styles.section} elevation={1}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Professional Experience ({form.experiences.length})
              </Text>
              <Button
                mode="text"
                onPress={addExperience}
                disabled={form.experiences.length >= 5}
                buttonColor="rgba(255,255,255,0)"
                textColor="#fff"
                compact
              >
                <Icon source="plus" size={30} color="#fff" />
              </Button>
            </View>
          </Surface>

          {form.experiences.map((exp, index) => (
            <Surface key={`exp-${index}`} style={styles.itemCard} elevation={1}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Experience #{index + 1}</Text>
                <IconButton
                  icon="close"
                  size={20}
                  iconColor="#fff"
                  onPress={() => removeExperience(index)}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Company Name"
                placeholderTextColor="#888"
                value={exp.company?.name}
                onChangeText={(text) =>
                  updateExperience(index, "company_name", text)
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
                  placeholder="Start Date (Y-M-D)" // <-- Updated
                  placeholderTextColor="#888"
                  value={exp.start_date || ""}
                  onChangeText={(text) =>
                    updateExperience(index, "start_date", text)
                  }
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="End Date (Y-M-D)" // <-- Updated
                  placeholderTextColor="#888"
                  value={exp.end_date || ""}
                  onChangeText={(text) =>
                    updateExperience(index, "end_date", text)
                  }
                />
              </View>
            </Surface>
          ))}

          {/* Projects Section */}
          <Surface style={styles.section} elevation={1}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Projects ({form.projects.length})
              </Text>
              <Button
                mode="text"
                onPress={addProject}
                disabled={form.projects.length >= 5}
                buttonColor="rgba(255,255,255,0)"
                textColor="#fff"
                compact
              >
                <Icon source="plus" size={30} color="#fff" />
              </Button>
            </View>
          </Surface>

          {form.projects.map((project, index) => (
            <Surface
              key={`proj-${index}`}
              style={styles.itemCard}
              elevation={1}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Project #{index + 1}</Text>
                <IconButton
                  icon="close"
                  size={20}
                  iconColor="#fff"
                  onPress={() => removeProject(index)}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Project Name"
                placeholderTextColor="#888"
                value={project.name}
                onChangeText={(text) => updateProject(index, "name", text)}
              />

              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description"
                placeholderTextColor="#888"
                value={project.description}
                onChangeText={(text) =>
                  updateProject(index, "description", text)
                }
                multiline
                numberOfLines={3}
              />

              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="Start Date (Y-M-D)" // <-- Updated
                  placeholderTextColor="#888"
                  value={project.start_date || ""}
                  onChangeText={(text) =>
                    updateProject(index, "start_date", text)
                  }
                />
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="End Date (Y-M-D)" // <-- Updated
                  placeholderTextColor="#888"
                  value={project.end_date || ""}
                  onChangeText={(text) =>
                    updateProject(index, "end_date", text)
                  }
                />
              </View>
            </Surface>
          ))}

          {/* Skills Section */}
          <Surface style={styles.section} elevation={1}>
            <Text style={styles.sectionTitle}>
              Skills ({form.skills?.length || 0})
            </Text>

            {allSkills.length > 0 && (
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

            {loadingSkills && (
              <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
            )}

            <View style={styles.skillChips}>
              {form.skills?.map((skillId) => {
                const skill = DbSkills.find((s) => s === skillId);
                return (
                  <TouchableOpacity
                    key={skillId.id}
                    onPress={() => removeSkill(skillId)}
                    style={styles.skillChipButton}
                  >
                    <Text style={styles.suggestionText}>
                      {skill?.name || `Skill #${skillId.id}`}
                    </Text>
                    <IconButton
                      icon="close"
                      size={16}
                      iconColor="#fff"
                      style={styles.closeIcon}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Search skills..."
              placeholderTextColor="#888"
              value={skillQuery}
              onChangeText={handleSearchSkills}
              onFocus={() => {
                setIsSkillsInputFocused(true);
              }}
              onBlur={() => {
                setIsSkillsInputFocused(false);
              }}
            />
          </Surface>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
          >
            {isSubmitting ? "Saving..." : "Save & Continue"}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#fff",
    fontWeight: "700",
    fontSize: 28,
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
    marginBottom: 0,
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
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
    fontSize: 14,
  },
  skillSuggestions: {
    marginBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  suggestionButton: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  skillChipButton: {
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(55,255,55,0.5)",
  },

  suggestionText: {
    color: "#fff",
    fontSize: 14,
  },

  suggestionIcon: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  skillChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  closeIcon: {
    marginLeft: 8,
    padding: 0, // Optional: reduce touch area
  },

  saveButton: {
    marginTop: 24,
    paddingVertical: 2,
  },
  dropdown: {
    backgroundColor: "#0f3460",
    borderRadius: 8,
  },
});
