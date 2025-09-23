import {
  signUpCandidate,
  signUpRecruiter,
} from "@/services/customSignUpService";
import { useAuth } from "@/store/authStore";
import { OnboardingForm } from "@/types/entities";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import AuthScreen from "./AuthScreen";
import CompanyDetails from "./CompanyDetails";
import CvParser from "./CvParser";
import EditCandidateProfile from "./EditCandidateProfile";
import UserDetails from "./UserDetails";

export default function OnboardingFlow() {
  const router = useRouter();
  const { setInitialized } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(0);

  const [form, setForm] = useState<OnboardingForm>({
    email: "",
    password: "",
    name: "",
    role: { id: 1, name: "candidate" }, // Default to candidate},
    country: null, // preload parsed CV here

    job_title: "",
    experiences: [], // preload parsed CV here
    projects: [], // preload parsed CV here
    skills: null,
    job_category: null,

    company: null, // for recruiters
    position_title: "",
  });

  const next = () => {
    if (steps.length <= step + 1) return; // Prevent going beyond last step
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.back(); // Go back to previous screen if at step 0
    }
  };

  const submit = async () => {
    try {
      setIsSubmitting(true);
      form.role.name === "candidate"
        ? await signUpCandidate(form)
        : await signUpRecruiter(form);

      setInitialized(true);
    } catch (err: any) {
      console.error("Signup failed:", err.message);
      alert("Signup Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    <AuthScreen
      //key="authscreen"
      form={form}
      setForm={setForm}
      onNext={next}
      isSignUp={isSignUp}
      setIsSignUp={setIsSignUp}
    />,
    <UserDetails key="details" form={form} setForm={setForm} onNext={next} />,
    ...(form.role.name === "candidate"
      ? [
          <CvParser key="cv" form={form} setForm={setForm} onNext={next} />,
          <EditCandidateProfile
            //key="edit_profile"
            form={form}
            setForm={setForm}
            onNext={submit}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />,
        ]
      : [
          <CompanyDetails
            //key="company"
            form={form}
            setForm={setForm}
            onNext={submit}
          />,
        ]),
  ];

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        {step > 0 && (
          <>
            <TouchableOpacity onPress={back}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <ProgressBar
              progress={(step + 1) / steps.length} // step is 0-based
              color="#fff"
              style={{ height: 10, borderRadius: 10, width: 150 }}
            />
          </>
        )}
        <View style={{ width: 28 }} /> {/* Spacer */}
      </View>

      <MotiView
        key={step} // triggers re-animation on step change
        from={{ opacity: 0, translateX: 50 }}
        animate={{ opacity: 1, translateX: 0 }}
        exit={{ opacity: 0, translateX: -50 }}
        transition={{ type: "timing", duration: 225 }}
        style={{ flex: 1, width: "100%" }}
      >
        {steps[step]}
      </MotiView>
      {isSubmitting && (
        <View style={styles.spinnerOverlay}>
          <ActivityIndicator animating={true} color="#fff" size="large" />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
