import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const SkeletonScreen = ({
  title,
  icon,
  description,
}: {
  title: string;
  icon: string;
  description: string;
}) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <MaterialCommunityIcons name={icon as any} size={64} color="#374151" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.comingSoon}>Coming Soon</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1724",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  comingSoon: {
    color: "#3b82f6",
    fontSize: 18,
    fontWeight: "600",
    backgroundColor: "#1f2937",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
