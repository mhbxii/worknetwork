import { OnboardingForm } from "@/types/userDetailsForm";
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface OnboardingProps {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
}

export default function EditCandidateProfile({ form, setForm, onNext }: OnboardingProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile ?</Text>
      
      <Text style={styles.debug}>{JSON.stringify(form, null, 2)}</Text>

      <Button onPress={onNext}>Finish!</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 },
  debug: { marginTop: 16, fontSize: 12, color: '#555' },
});
