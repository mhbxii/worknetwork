import SignOutModal from "@/components/ui/SignOutModal";
import { SkeletonScreen } from "@/components/ui/skeletonScreen";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

export default function System() {
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <SafeAreaView style={styles.container}>
        {/* Use a View wrapper instead of letting SkeletonScreen be flex: 1 */}
        <View style={styles.skeletonWrapper}>
          <SkeletonScreen
            title="System Settings"
            icon="cog"
            description="Platform configuration and system logs"
          />
        </View>
        
        {/* Button container */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained-tonal"
            icon="logout"
            onPress={() => setSignOutModalVisible(true)}
            style={styles.button}
          >
            Sign Out
          </Button>
        </View>

        {/* Modal - same level as in Profile component */}
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
  skeletonWrapper: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
  },
  button: {
    width: "80%",
    maxWidth: 300,
  },
});