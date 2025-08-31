import AboutModal from "@/components/ui/AboutModal";
import HelpSupportModal from "@/components/ui/HelpSupportModal";
import SignOutModal from "@/components/ui/SignOutModal";
import { useAuth } from "@/store/authStore";
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Avatar, Surface } from "react-native-paper";

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  type: "screen" | "modal";
  action: () => void;
}

export default function Profile() {
  const { user, profile, initialized } = useAuth();
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: "profile",
      title: "View/Edit Profile",
      icon: "account-edit",
      type: "screen",
      action: () => router.push("/profile/edit"),
    },
    {
      id: "account",
      title: "Account Settings",
      icon: "cog",
      type: "screen",
      action: () => router.push("/profile/account"),
    },
    {
      id: "password",
      title: "Change Password",
      icon: "lock-reset",
      type: "screen",
      action: () => router.push("/profile/password"),
    },
    {
      id: "help",
      title: "Help & Support",
      icon: "help-circle",
      type: "modal",
      action: () => setHelpModalVisible(true),
    },
    {
      id: "about",
      title: "About",
      icon: "information",
      type: "modal",
      action: () => setAboutModalVisible(true),
    },
    {
      id: "signout",
      title: "Sign Out",
      icon: "logout",
      type: "modal",
      action: () => setSignOutModalVisible(true),
    },
  ];

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity onPress={item.action} activeOpacity={0.7}>
      <Surface style={styles.menuItem} elevation={2}>
        <View style={styles.menuItemContent}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color="#fff"
              style={styles.menuIcon}
            />
            <Text style={styles.menuTitle}>{item.title}</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const getUserDisplayName = () => {
    if (!user) return "User";
    return user.name || user.email || "User";
  };

  const getProfileSummary = () => {
    if (!profile) return "No profile data";

    if ("job_title" in profile) {
      // Candidate profile
      return profile.job_title || "Candidate";
    } else {
      // Recruiter profile
      return profile.position_title || "Recruiter";
    }
  };

  if (!initialized) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No user data found</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <SafeAreaView style={styles.container}>
        {/* Profile Header */}
        <Surface style={styles.profileHeader} elevation={3}>
          <View style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={getUserDisplayName().charAt(0).toUpperCase()}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getUserDisplayName()}</Text>
              <Text style={styles.profileSummary}>{getProfileSummary()}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </Surface>

        {/* Menu Items */}
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          style={styles.menuList}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Modals */}
        <HelpSupportModal
          visible={helpModalVisible}
          onClose={() => setHelpModalVisible(false)}
        />
        <AboutModal
          visible={aboutModalVisible}
          onClose={() => setAboutModalVisible(false)}
        />
        <SignOutModal
          visible={signOutModalVisible}
          onClose={() => setSignOutModalVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  profileHeader: {
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    backgroundColor: "rgba(255,255,255,0.15)",
    marginRight: 16,
  },
  avatarLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileSummary: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginBottom: 4,
  },
  profileEmail: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuContent: {
    paddingBottom: 40,
  },
  menuItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
  },
  menuTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  separator: {
    height: 12,
  },
});
