import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/store/authStore";
import { useChatStore } from "@/store/useChatStore";
import { useMetaStore } from "@/store/useMetaStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function TabLayout() {
  const { user } = useAuth();
  const fetchMeta = useMetaStore((s) => s.fetchMeta);

  // Notifications
  const { fetchNotifications, subscribeToRealtime } = useNotificationsStore();
  const unreadNotifications = useNotificationsStore(
    (s) => s.notifications.filter((n) => !n.read_at).length
  );

  // Chat - unified store
  const {
    fetchConversations,
    subscribeToRealtime: subscribeToChatRealtime,
    getTotalUnreadMessages,
    setCurrentUser,
    reset: resetChat,
    unsubscribeRealtime: unsubscribeChatRealtime,
  } = useChatStore();

  const unreadMessages = user ? getTotalUnreadMessages(user.id) : 0;

  useEffect(() => {
    if (!user) return;

    // Set current user in chat store
    setCurrentUser({ id: user.id, name: user.name });

    // Initialize notifications
    fetchNotifications(user.id);
    subscribeToRealtime(user.id);

    // Initialize chat
    fetchConversations({ id: user.id, name: user.name });
    subscribeToChatRealtime(user.id);

    return () => {
      // Cleanup
      unsubscribeChatRealtime();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchMeta(); // load once
  }, []);

  const colorScheme = useColorScheme();
  const isAdmin = user?.role.name === "admin";

  const Badge = ({ count }: { count: number }) => (
    <AnimatePresence>
      {count > 0 && (
        <MotiView
          from={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", damping: 12 }}
          style={styles.badge}
        >
          <Text style={styles.badgeNumberCount}>
            {count > 99 ? "99+" : count}
          </Text>
        </MotiView>
      )}
    </AnimatePresence>
  );

  return (
    <Tabs
      initialRouteName={isAdmin ? "admin/Statistics" : "index"}
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
      {/* Regular user tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: !isAdmin ? "/" : null,
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Messages"
        options={{
          href: !isAdmin ? "/Messages" : null,
          title: "Messages",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons
                name="message"
                size={size}
                color={color}
              />
              <Badge count={unreadMessages} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="AddJob"
        options={{
          href: user?.role.name === "recruiter" ? "/AddJob" : null,
          title: "Add Job",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="plus-circle" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Notifications"
        options={{
          href: !isAdmin ? "/Notifications" : null,
          title: "Notifications",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="bell" size={size} color={color} />
              <Badge count={unreadNotifications} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          href: !isAdmin ? "/Profile" : null,
          title: "Profile",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      
      {/* Admin tabs */}
      <Tabs.Screen
        name="admin/Statistics"
        options={{
          href: isAdmin ? "/admin/Statistics" : null,
          title: "Statistics",
          headerShown: true,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/Reports"
        options={{
          href: isAdmin ? "/admin/Reports" : null,
          title: "Reports",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="flag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/Users"
        options={{
          href: isAdmin ? "/admin/Users" : null,
          title: "Users",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/System"
        options={{
          href: isAdmin ? "/admin/System" : null,
          title: "System",
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
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