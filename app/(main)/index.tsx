import { useAuth } from "@/store/authStore";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Button, Text } from "react-native-paper";

export default function Index() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await useAuth.getState().signOut();
    router.replace("/(auth)/OnboardingFlow");
  };

  if (!user) return <Text>Loading user data...</Text>;

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Welcome to the App {user.name}!
      </Text>

      <Text style={{ fontWeight: "bold" }}>Email:</Text>
      <Text>{user.email}</Text>

      {profile?.role === "candidate" && (
        <>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Job Title:</Text>
          <Text>{profile.data.job_title}</Text>

          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Category ID:</Text>
          <Text>{profile.data.job_category_id}</Text>

          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Skills:</Text>
          <Text>{profile.data.skills.join(", ")}</Text>

          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Projects:</Text>
          {profile.data.projects.map((p, i) => (
            <Text key={i}>
              • {p.name} ({p.start_date} - {p.end_date})
            </Text>
          ))}

          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Experiences:</Text>
          {profile.data.experiences.map((e, i) => (
            <Text key={i}>
              • {e.job_title} @ {e.company_name || "Unknown"} ({e.start_date} - {e.end_date})
            </Text>
          ))}
        </>
      )}

      {profile?.role === "recruiter" && (
        <>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Company:</Text>
          <Text>{profile.data.company_name}</Text>
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>Position:</Text>
          <Text>{profile.data.position_title}</Text>
        </>
      )}

      {!profile && <Text style={{ fontWeight: "bold", marginTop: 10 }}>Hello</Text>}

      <Button style={{ marginTop: 20 }} onPress={handleSignOut}>
        Sign Out
      </Button>
    </ScrollView>
  );
}

