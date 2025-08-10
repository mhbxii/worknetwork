import { useAuth } from "@/store/authStore";
import { Button, Text } from "react-native-paper";

export default function Profile() {
  const { profile, initialized, signOut } = useAuth(); // or however you store auth info

  return (
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
  );
}
