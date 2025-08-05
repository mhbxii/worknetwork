import { OnboardingForm } from '@/types/userDetailsForm';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { MotiText } from 'moti';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { signInWithEmail, signInWithGoogle } from '../../services/authService';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
}

export default function AuthScreen({ form, setForm, onNext, isSignUp, setIsSignUp }: Props) {

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleAuth = async () => {
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        onNext(); // Move to next step in onboarding flow
      } else {
        // ✅ Normal login
        await signInWithEmail(form.email, form.password);
        router.replace('/'); // navigate to main/index
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Google Sign-In (Web for Expo)
  const handleGoogleAuth = async () => {
    try {
      const errorMsg = await signInWithGoogle(); // returns string | null
      if (errorMsg) setError(errorMsg);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <MotiText
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            style={styles.title}
          >
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </MotiText>

          <TextInput
            label="Email"
            mode="outlined"
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            mode="contained"
            loading={loading}
            onPress={handleAuth}
            style={styles.button}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>

          <Button
            icon={() => <AntDesign name="google" size={20} color="#fff" />}
            mode="contained-tonal"
            onPress={handleGoogleAuth}
            style={[styles.button, { backgroundColor: '#db4437', marginTop: 12 }]}
            labelStyle={{ color: '#fff' }}
          >
            Continue with Google
          </Button>

          <Button
            mode="text"
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchBtn}
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
  },
  input: { marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  button: { marginTop: 12, paddingVertical: 4 },
  switchBtn: { marginTop: 16 },
  error: { color: '#f25', marginBottom: 8, textAlign: 'center' },
});
