import { SkeletonScreen } from "@/components/ui/skeletonScreen";
import { useAuth } from "@/store/authStore";
import { Button, Text } from "react-native-paper";

export default function System() {
  const { signOut } = useAuth();
  return (
    <>
      <SkeletonScreen
        title="System Settings"
        icon="cog"
        description="Platform configuration and system logs"
      />
      <Button mode="contained" onPress={signOut} style={{ marginTop: 20, backgroundColor: "#5ab25c" }}>
        
        <Text>Sign Out</Text>
      </Button>
    </>
  );
}
