import { JobList } from "@/components/ui/JobList";
import { useHome } from "@/hooks/useHome";
import { useAuth } from "@/store/authStore";
import { ActivityIndicator, Text } from "react-native-paper";

export default function Index() {
  const { profile, initialized } = useAuth(); // or however you store auth info

  const { jobs, loading, refresh, onJobPress, onJobLongPress } = useHome(
    profile
  );

  // Wait until auth is initialized and profile is loaded
  if (!initialized) return <ActivityIndicator animating={true} size="large" />;

  if (!profile) {
    return <Text>Error: User profile not found.</Text>;
  }

  return (
    <>
      <JobList
        jobs={jobs}
        loading={loading}
        onRefresh={refresh}
        onPress={onJobPress}
        onLongPress={onJobLongPress}
      />
    </>
  );
}
