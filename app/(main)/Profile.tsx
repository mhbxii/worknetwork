import { useAuth } from "@/store/authStore";
import { ScrollView } from "react-native-gesture-handler";
import { Button, Text } from "react-native-paper";

export default function Profile() {
  const { profile, initialized, signOut } = useAuth(); // or however you store auth info

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
    <>
      {!initialized ? (
        <Text>Loading...</Text>
      ) : profile ? (
        <>
          <Text>{JSON.stringify(profile, null, 4)}</Text>
          <Button mode="contained" onPress={signOut}>Sign Out</Button>
        </>
      ) : (
        <Text>Error: User profile not found.</Text>
      )}
    </>
    </ScrollView>
  );
}
