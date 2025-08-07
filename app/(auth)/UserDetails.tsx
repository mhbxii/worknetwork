import { supabase } from "@/lib/supabase";
import { OnboardingForm } from "@/types/userDetailsForm";
import { LinearGradient } from "expo-linear-gradient";
import { MotiText } from "moti";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import CountryFlag from "react-native-country-flag";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";

interface Props {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

export default function UserDetails({ form, setForm, onNext }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await supabase
        .from("country")
        .select("*")
        .order("name");
      if (!error && data) setCountries(data);
    };
    fetchCountries();
  }, []);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedCountry = countries.find((c) => c.id === form.country_id);

  // Dynamic segmented button colors
  const roleTheme = (role: "candidate" | "recruiter") => ({
    colors: {
      secondaryContainer:
        form.role === role
          ? role === "candidate"
            ? "#4CAF50" // green
            : "#FF9800" // orange
          : "#333", // unselected background
      onSecondaryContainer: "#fff", // text color
    },
  });

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <MotiText
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              style={styles.title}
            >
              User Details
            </MotiText>

            {/* Name */}
            <TextInput
              label="Your Name"
              mode="outlined"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
              style={styles.input}
              placeholder="John Doe"
              autoCapitalize="words"
            />

            {/* Role Selection */}
            <Text style={styles.label}>Select Role</Text>
            <SegmentedButtons
              value={form.role}
              onValueChange={(role) =>
                setForm({ ...form, role: role as "candidate" | "recruiter" })
              }
              buttons={[
                {
                  value: "candidate",
                  label: "Candidate",
                  icon: "account",
                  style: {
                    backgroundColor:
                      form.role === "candidate" ? "#4CAF50" : "#333",
                  },
                  labelStyle: { color: "#fff" },
                },
                {
                  value: "recruiter",
                  label: "Recruiter",
                  icon: "briefcase",
                  style: {
                    backgroundColor:
                      form.role === "recruiter" ? "#FF9800" : "#333",
                  },
                  labelStyle: { color: "#fff" },
                },
              ]}
              style={{ marginBottom: 16 }}
            />

            {/* Label */}
            <Text style={styles.label}>Choose your country</Text>

            {/* Search Box */}
            <TextInput
              label="Search Country"
              mode="outlined"
              value={search}
              onChangeText={setSearch}
              style={styles.input}
              placeholder="Start typing..."
            />

            {/* Country Buttons (3 per row, responsive width) */}
            <View style={styles.dropdown}>
              {filtered.slice(0, 3).map((c) => (
                <View
                  key={c.id}
                  style={{
                    width: `${100 / Math.min(filtered.length, 3)}%`, // 1-3 items fill space
                    padding: 4,
                  }}
                >
                  <Button
                    mode={form.country_id === c.id ? "contained" : "outlined"}
                    onPress={() => setForm({ ...form, country_id: c.id })}
                    style={{ borderRadius: 12 }}
                    contentStyle={{
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    <CountryFlag isoCode={c.code} size={18} />
                    {/* Country Name <Text style={styles.countryName}> {c.name}</Text> */}
                  </Button>
                </View>
              ))}
            </View>

            {/* Next Button */}
            <Button
              mode="contained"
              onPress={onNext}
              style={styles.button}
              disabled={!form.name || !form.country_id || !form.role}
            >
              Next
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  label: { color: "#fff", marginBottom: 8 },
  input: { marginBottom: 16, backgroundColor: "rgba(255,255,255,0.1)" },
  button: { marginTop: 24 },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 8,
  },
  countryText: { color: "#fff", marginLeft: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countryName: { color: "#fff", marginLeft: 6, fontSize: 12 },
  
});
