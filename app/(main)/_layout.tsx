import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/store/authStore";
import { useMetaStore } from "@/store/useMetaStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import { Pressable } from "react-native-gesture-handler";

export default function TabLayout() {
  const { user } = useAuth();
  const fetchMeta = useMetaStore((s) => s.fetchMeta);
  const { fetchNotifications, subscribeToRealtime } = useNotificationsStore();

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id);
    subscribeToRealtime(user.id);
  }, []);

  const unreadCount = useNotificationsStore(
    (s) => s.notifications.filter((n) => !n.read_at).length
  );

  useEffect(() => {
    fetchMeta(); // load once
  }, []);

  const colorScheme = useColorScheme();

  const AddJobBtn = () => (
    <Pressable
      onPress={() => alert("Add Job clicked")}
      style={{
        marginRight: 12,
        backgroundColor: "#000",
        borderRadius: 50,
        padding: 8,
      }}
    >
      <MaterialCommunityIcons name="plus" size={26} color={"#0f0"} />
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: true,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          headerRight: () => <AddJobBtn />,
        }}
      />
      <Tabs.Screen
        name="Messages"
        options={{
          title: "Messages",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Notifications"
        options={{
          title: "Notifications",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="bell" size={size} color={color} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    style={styles.badge}
                  >
                    <Text style={styles.badgeNumberCount}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </MotiView>
                )}
              </AnimatePresence>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNumberCount: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
