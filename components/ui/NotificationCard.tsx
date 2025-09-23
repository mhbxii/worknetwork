// components/NotificationCard.tsx
import { AntDesign } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MotiText, MotiView } from "moti";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

dayjs.extend(relativeTime);

type Props = {
  id: number;
  type: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  onPress: (id: number) => void;
};

export default function NotificationCard({ id, type, content, createdAt, readAt, onPress }: Props) {
  const isUnread = !readAt;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 300 }}
      style={styles.card}
    >
      <Pressable onPress={() => onPress(id)} style={styles.contentContainer}>
        <AntDesign
          name={type === "viewed" ? "eye" : "bell"}
          size={22}
          color={isUnread ? "#fff" : "#9ca3af"}
          style={styles.icon}
        />
        <MotiView style={styles.textContainer}>
          <MotiText
            style={[
              styles.content,
              { fontWeight: isUnread ? "700" : "400", color: isUnread ? "#fff" : "#9ca3af" }
            ]}
            numberOfLines={2}
          >
            {content}
          </MotiText>
          <Text style={styles.time}>{dayjs(createdAt).fromNow()}</Text>
        </MotiView>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: { marginRight: 12 },
  textContainer: { flex: 1 },
  content: {
    fontSize: 16,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
