import { OnboardingForm } from "@/types/userDetailsForm";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

interface OnboardingProps {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
}

export default function CompanyDetails({
  form,
  setForm,
  onNext,
}: OnboardingProps) {
  let clicked = false;
  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Recruiter Company Details</Text>

          <TextInput
            label="Company name"
            mode="outlined"
            value={form.company_name}
            onChangeText={(text) => setForm({ ...form, company_name: text })}
            style={styles.input}
          />

          <TextInput
            label="Position title"
            mode="outlined"
            value={form.position_title}
            onChangeText={(text) => setForm({ ...form, position_title: text })}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={() => {
              if (clicked) return;
              clicked = true;
              onNext();
            }}
            style={styles.button}
          >
            Submit Recruiter
          </Button>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#fff",
    fontWeight: "700",
    fontSize: 28,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  button: {
    marginTop: 12,
    paddingVertical: 4,
  },
  debug: {
    marginTop: 16,
    fontSize: 12,
    color: "#555",
  },
});
