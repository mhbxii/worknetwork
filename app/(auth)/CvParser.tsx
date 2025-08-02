import { OnboardingForm } from "@/types/userDetailsForm";
import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

interface OnboardingProps {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
}

export default function CvParser({ form, setForm, onNext }: OnboardingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Candidate CV Parser</Text>

      <TextInput
        placeholder="Profile summary"
        value={form.profile_summary}
        onChangeText={(text) => setForm({ ...form, profile_summary: text })}
        style={styles.input}
      />

      <Text style={styles.debug}>{JSON.stringify(form, null, 2)}</Text>

      <Button title="Next" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 },
  debug: { marginTop: 16, fontSize: 12, color: '#555' },
});
