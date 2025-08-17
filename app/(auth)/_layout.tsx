import { Stack } from 'expo-router';

export default function AuthLayout() {
  // console.log('AuthLayout render - minimal version');
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
