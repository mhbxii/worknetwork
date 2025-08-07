import { summarizeCVToForm } from "@/services/geminiSummarizer";
import { OnboardingForm } from "@/types/userDetailsForm";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { MotiText } from "moti";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";

interface Props {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
}

export default function CvParser({ form, setForm, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePickPDF = async () => {
    setError("");
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file) return;

    if (file.size && file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5MB).");
      return;
    }

    await processAndSummarizePDF(file.uri, file.name);
  };

  const processAndSummarizePDF = async (uri: string, filename?: string) => {
    try {
      setLoading(true);
      setProgress(0);

      // 1️⃣ Upload to PDF parser
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "application/pdf",
        name: filename || "cv.pdf",
      } as any);

      const parseXhr = new XMLHttpRequest();
      parseXhr.open(
        "POST",
        "https://pdf-parser-4-vercel-gvtu.vercel.app/api/parse_pdf"
      );
      parseXhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress((e.loaded / e.total) * 0.37);
      };

      const parsedText: string = await new Promise((resolve, reject) => {
        parseXhr.onload = () => {
          if (parseXhr.status >= 200 && parseXhr.status < 300) {
            const res = JSON.parse(parseXhr.responseText);
            if (res.text) return resolve(res.text);
            return reject(new Error(res.error || "No text extracted"));
          }
          reject(new Error("Parse failed: " + parseXhr.status));
        };
        parseXhr.onerror = () => reject(new Error("Network error"));
        parseXhr.send(formData);
      });

      // 2️⃣ Summarize via Gemini
      setProgress(0.68);
  
      // ✅ New clean call
      const updatedForm = await summarizeCVToForm(parsedText, form);
      setForm(updatedForm);

      setProgress(1);
      setSuccess(true);
  
      setTimeout(() => {
        setSuccess(false);
        onNext();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setProgress(0);
    }
  };
  

  // ⏭ Skip parsing
  const handleSkip = () => {
    setForm({
      ...form,
      job_title: "",
      projects: [],
      experiences: [],
      skills: [],
    });
    onNext();
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.card}>
          <MotiText
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
            style={styles.title}
          >
            Upload Your CV
          </MotiText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <ProgressBar
                progress={progress}
                color="#4CAF50"
                style={{
                  marginTop: 12,
                  height: 6,
                  borderRadius: 6,
                  width: "80%",
                }}
              />
              <Text style={{ color: "#fff", marginTop: 8 }}>
                Processing... {Math.round(progress * 100)}%
              </Text>
            </View>
          ) : success ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              <Text style={{ color: "#4CAF50", marginTop: 8 }}>Done!</Text>
            </View>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handlePickPDF}
                style={styles.button}
              >
                Select PDF
              </Button>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                mode="text"
                style={styles.skipButton}
                onPress={handleSkip}
              >
                Skip
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#fff",
    fontWeight: "700",
    fontSize: 28,
  },
  button: { marginTop: 12, paddingVertical: 4 },
  skipButton: { marginTop: 12, paddingVertical: 1, width: 10 },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  hint: { color: "#aaa", marginTop: 12, textAlign: "center" },
  preview: { color: "#fff", marginTop: 16, fontSize: 12 },
  error: { color: "#f25", marginTop: 12, textAlign: "center" },
});
