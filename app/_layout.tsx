import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initAuth } from "@/services/authInit";
import { useAuth } from '@/store/authStore';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, profile, initialized } = useAuth(); // ✅ use initialized from store
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const cleanup = initAuth();
    return cleanup;
  }, []);

  // 🔹 Redirect logic
useEffect(() => {
  if (!initialized || !segments.length) return;
  
  const isAuthRoute = segments[0] === '(auth)';
  
  if (!user && !isAuthRoute) {
    // No user at all -> go to auth
    router.replace('/OnboardingFlow');
  } else if (user && !profile && user.role?.name !== 'admin' && !isAuthRoute) {
    // User exists but no profile (and not admin) -> go to onboarding
    router.replace('/OnboardingFlow');
  } else if (user && (profile || user.role?.name === 'admin') && isAuthRoute) {
    // User exists with profile OR is admin -> go to main app
    router.replace('/(main)');
  }
}, [profile, initialized, segments]);

  if (!loaded || !initialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: '#1a1a2e' }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <SafeAreaProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </NavigationThemeProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
