import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Surface } from "react-native-paper";

import CategorySelector from "@/components/ui/JobCategorySelector";
import { Toast } from "@/components/ui/Toast";
import { addJob, AddJobData } from "@/services/addJobService";
import { useAuth } from "@/store/authStore";
import { useMetaStore } from "@/store/useMetaStore";
import { MetaOption, RecruiterProfile, UserProfile } from "@/types/entities";

// Helper type guard function (you can place this in your types/entities file)
function isRecruiterProfile(p: UserProfile | null): p is RecruiterProfile {
  return !!p && "position_title" in p;
}

interface FormData {
  title: string;
  description: string;
  category: MetaOption | null;
  skills: MetaOption[];
}

const INITIAL_FORM_STATE: FormData = {
  title: "",
  description: "",
  category: null,
  skills: [],
};

export default function AddJob() {
  const { profile } = useAuth();
  const { categoryOptions, DbSkills, loading: metaLoading, fetchMeta } = useMetaStore();
  
  const [form, setForm] = useState<FormData>(INITIAL_FORM_STATE);
  const [skillQuery, setSkillQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  useEffect(() => {
    if (categoryOptions.length === 0 || DbSkills.length === 0) {
      fetchMeta();
    }
  }, []);

  const filteredSkills = useMemo(() => {
    if (!skillQuery.trim()) return [];
    
    return DbSkills
      .filter((skill) => 
        skill.name.toLowerCase().includes(skillQuery.toLowerCase()) &&
        !form.skills.some((selected) => selected.id === skill.id)
      )
      .slice(0, 6);
  }, [skillQuery, DbSkills, form.skills]);

  const handleFormChange = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: MetaOption) => {
    if (!form.skills.some((s) => s.id === skill.id)) {
      handleFormChange("skills", [...form.skills, skill]);
      setSkillQuery("");
    }
  };

  const removeSkill = (skillId: number) => {
    handleFormChange("skills", form.skills.filter((skill) => skill.id !== skillId));
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };
  
  // ▼▼▼ THE FIX - PART 1: Type Guarding ▼▼▼
  // First, check if the profile is a RecruiterProfile. TypeScript will then
  // treat `profile` as `RecruiterProfile` for the rest of the component's scope.
  if (!isRecruiterProfile(profile)) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="account-lock-outline" size={48} color="#E94560" />
          <Text style={[styles.loadingText, { marginTop: 20 }]}>
            Only recruiters can post new jobs.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const handleSubmit = async () => {
    // Validation
    if (!form.title.trim()) return showToast("Title is required", "error");
    if (!form.description.trim()) return showToast("Description is required", "error");
    if (!form.category) return showToast("Category is required", "error");
    if (form.skills.length === 0) return showToast("At least one skill is required", "error");
    
    // ▼▼▼ THE FIX - PART 2: Safe Access ▼▼▼
    // The type guard above ensures `profile.company` exists on `profile`.
    // We only need to check if it has a value.
    if (!profile.company?.id) {
      showToast("Company information not found in your profile", "error");
      return;
    }

    setIsSubmitting(true);

    const jobData: AddJobData = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      skills: form.skills,
      companyId: profile.company.id, // This is now type-safe
    };

    try {
      const result = await addJob(jobData);
      if (result.success) {
        showToast("Job posted successfully!", "success");
        setForm(INITIAL_FORM_STATE);
      } else {
        showToast(result.error || "Failed to post job", "error");
      }
    } catch (error) {
        showToast("An unexpected error occurred.", "error")
    } finally {
        setIsSubmitting(false);
    }
  };

  if (metaLoading) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="briefcase-plus" size={62} color="#fff" />
          <Text style={styles.title}>Post New Job</Text>
          <Text style={styles.subtitle}>
            {/* ▼▼▼ THE FIX - PART 3: Safe JSX Access ▼▼▼ */}
            {profile.company?.name || "Your Company"}
          </Text>
        </View>

        {/* Title Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior React Native Developer"
            placeholderTextColor="#888"
            value={form.title}
            onChangeText={(text) => handleFormChange("title", text)}
          />
        </Surface>

        {/* Description Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Job Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the role, responsibilities, and requirements..."
            placeholderTextColor="#888"
            value={form.description}
            onChangeText={(text) => handleFormChange("description", text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </Surface>

        {/* Category Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>Job Category *</Text>
          <CategorySelector
            categories={categoryOptions}
            selectedValue={form.category?.id || null}
            onSelect={(value) => {
              const category = categoryOptions.find((cat) => cat.id === value);
              handleFormChange("category", category || null);
            }}
          />
        </Surface>

        {/* Skills Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>
            Required Skills * ({form.skills.length})
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Search and add skills..."
            placeholderTextColor="#888"
            value={skillQuery}
            onChangeText={setSkillQuery}
          />
          
          {filteredSkills.length > 0 && (
            <View style={styles.skillSuggestions}>
              {filteredSkills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  onPress={() => addSkill(skill)}
                  style={styles.suggestionButton}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                  <Text style={styles.suggestionText}>{skill.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={styles.skillChips}>
            {form.skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                onPress={() => removeSkill(skill.id)}
                style={styles.skillChip}
              >
                <Text style={styles.skillChipText}>{skill.name}</Text>
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </Surface>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
          labelStyle={styles.submitButtonLabel}
        >
          {isSubmitting ? "Posting Job..." : "Post Job"}
        </Button>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 4,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  helperText: {
    color: "#888",
    marginTop: 8,
  },
  skillSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  suggestionText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  skillChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 144, 226, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.5)",
  },
  skillChipText: {
    color: "#fff",
    marginRight: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 16,
    marginTop: 20,
    elevation: 8,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  bottomSpacing: {
    height: 40,
  },
});