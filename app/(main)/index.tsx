import { useAuth } from "@/store/authStore";
import { useRouter } from "expo-router";
import { Button, Text } from "react-native-paper";

export default function Index() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace("/(auth)/AuthScreen");
  };

  if (!user) return <Text>Loading user data...</Text>;

  return (
    <>
      <Text>Welcome to the App {user.name}! </Text>
      <Button onPress={handleSignOut}>Sign Out</Button>
    </>
  );
}
