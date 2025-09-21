import { OnboardingForm } from '@/types/entities';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { MotiText, MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet } from 'react-native';
// Note: Using Provider and custom theme for react-native-paper
import { Button, Provider as PaperProvider, Text, TextInput, useTheme } from 'react-native-paper';
import { signInWithEmail } from '../../services/authService';

WebBrowser.maybeCompleteAuthSession();

// --- Design System Constants ---
// By defining colors here, we create a consistent and easily updatable theme.
const COLORS = {
  backgroundStart: '#1a1a2e', // Match other screens
  backgroundEnd: '#16213e',   // Match other screens  
  accent: '#C084FC',          // Medium violet
  textPrimary: '#ffffff',     // Pure white for text
  textSecondary: '#a1a7b0',   // Keep the grey
  cardBackground: 'rgba(255,255,255,0.05)', // Match other screens
  cardBorder: 'rgba(255, 255, 255, 0.1)',   // Match other screens
  error: '#f25',              // Keep the red
};

interface Props {
  form: OnboardingForm;
  setForm: (form: OnboardingForm) => void;
  onNext: () => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
}

// We wrap the main component to provide it with the custom Paper theme
export default function AuthScreenWrapper(props: Props) {
  // --- React Native Paper Theme ---
  // This allows us to customize components like TextInput to match our design system.
  const paperTheme = {
    ...useTheme(),
    colors: {
      ...useTheme().colors,
      primary: COLORS.accent, // Use accent color for focus highlights
      text: COLORS.textPrimary,
      placeholder: COLORS.textSecondary,
      background: 'transparent',
      surfaceVariant: 'transparent', // Removes the default grey background on inputs
      outline: 'rgba(255, 255, 255, 0.2)', // Softer outline for unfocused inputs
    },
    roundness: 12, // Consistent border radius
  };

  return (
    <PaperProvider theme={paperTheme}>
      <AuthScreen {...props} />
    </PaperProvider>
  );
}


function AuthScreen({ form, setForm, onNext, isSignUp, setIsSignUp }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- Staggered Animations ---
  // Using useMemo to define animation delays prevents them from being recalculated on every render.
  const animationDelays = useMemo(() => ({
    appName: 0,
    tagline: 100,
    card: 250,
    formElements: 400,
  }), []);

  const handleAuth = async () => {
    if (!form?.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        onNext();
      } else {
        await signInWithEmail(form.email, form.password);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // ... logic remains the same
  };

  return (
    // REFINEMENT: More subtle, professional gradient.
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={{ flex: 1 }}> 
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* REFINEMENT: App name is now integrated into the main screen, not a separate ribbon. */}
        <MotiText
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: animationDelays.appName }}
          style={styles.appName}
        >
          Work<Text style={{ color: COLORS.accent, fontWeight: '800' }}>Network</Text>
        </MotiText>

        {/* REFINEMENT: Tagline simplified, relying on typography and spacing, not effects. */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: animationDelays.tagline }}
          style={styles.taglineContainer}
        >
          <Text style={styles.tagline}>Where Talent Meets Opportunity</Text>
        </MotiView>

        {/* REFINEMENT: Card is now a "frosted glass" panel with a subtle border. */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: animationDelays.card }}
          style={styles.card}
        >
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: animationDelays.formElements }}
            style={styles.title}
          >
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </MotiText>

          {/* REFINEMENT: TextInput styles are now controlled by the PaperProvider theme for consistency. */}
          <TextInput
            label="Email"
            mode="outlined"
            value={form?.email}
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

          {/* REFINEMENT: Clear button hierarchy. Primary action is solid, secondary is text. */}
          <Button
            mode="contained"
            loading={loading}
            onPress={handleAuth}
            style={styles.button}
            labelStyle={{ fontWeight: 'bold', paddingVertical: 4 }}
            buttonColor={COLORS.accent}
          >
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>

          <Button
            mode="text"
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchBtn}
            textColor={COLORS.textSecondary}
            labelStyle={{fontWeight: '500'}}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </MotiView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // REFINEMENT: Removed `appNameRibbon`. Increased container padding for breathing room.
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
    // REFINEMENT: More vertical space for a less cramped feel.
    marginBottom: 16,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 48, // Generous spacing before the form
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // REFINEMENT: Modern "glassmorphism" card style.
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: COLORS.textPrimary, // Use primary text color for consistency
    fontWeight: '600',
    fontSize: 22,
  },
  input: {
    marginBottom: 16,
    // Background color is handled by the Paper theme now
  },
  button: {
    marginTop: 12,
    borderRadius: 12,
  },
  switchBtn: {
    marginTop: 16,
  },
  error: {
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});