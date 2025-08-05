import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ProgressBar } from "react-native-paper";
import { fetchUser } from "../../services/userService";
import AuthScreen from "./AuthScreen";
import CompanyDetails from "./CompanyDetails";
import CvParser from "./CvParser";
import EditCandidateProfile from "./EditCandidateProfile";
import UserDetails from "./UserDetails";

export default function OnboardingFlow() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "candidate" as "candidate" | "recruiter",
    country_id: null as number | null,
    profile_summary: "",
    skills: [] as number[],
    job_category_id: null as number | null,
    company_id: null as number | null,
    company_name: "",
    position_title: "",
  });

  const next = () => setStep((s) => s + 1);
  const back = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.back(); // Go back to previous screen if at step 0
    }
  };

  const submit = async () => {
    try {
      const endpoint =
        form.role === "candidate"
          ? "/functions/v1/sign_up_candidate"
          : "/functions/v1/sign_up_recruiter";

      const payload =
        form.role === "candidate"
          ? {
              email: form.email,
              password: form.password,
              name: form.name,
              country_id: form.country_id,
              profile_summary: form.profile_summary,
              skills: form.skills,
              job_category_id: form.job_category_id,
            }
          : {
              email: form.email,
              password: form.password,
              name: form.name,
              country_id: form.country_id,
              company_id: form.company_id,
              company_name: form.company_name,
              position_title: form.position_title,
            };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Signup failed");

      await fetchUser();
      router.replace("/");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const steps = [
    <AuthScreen
      key="authscreen"
      form={form}
      setForm={setForm}
      onNext={next}
      isSignUp={isSignUp}
      setIsSignUp={setIsSignUp}
    />,
    <UserDetails key="details" form={form} setForm={setForm} onNext={next} />,
    ...(form.role === "candidate"
      ? [
          <CvParser key="cv" form={form} setForm={setForm} onNext={next} />,
          <EditCandidateProfile
            key="edit_profile"
            form={form}
            setForm={setForm}
            onNext={submit}
          />,
        ]
      : [
          <CompanyDetails
            key="company"
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
        transition={{ type: "timing", duration: 300 }}
        style={{ flex: 1, width: "100%" }}
      >
        {steps[step]}
      </MotiView>
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
});
