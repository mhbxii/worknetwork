import NotificationCard from "@/components/ui/NotificationCard";
import { useAuth } from "@/store/authStore";
import { useNotificationsStore } from "@/store/useNotificationStore";
import { format, isToday, isYesterday } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

// Group notifications by date
const groupNotificationsByDate = (notifications: any[]) => {
  const groups: Record<string, any[]> = {};
  notifications.forEach((notif) => {
    const date = new Date(notif.created_at);
    let section = format(date, "dd MMM yyyy");
    if (isToday(date)) section = "Today";
    else if (isYesterday(date)) section = "Yesterday";
    if (!groups[section]) groups[section] = [];
    groups[section].push(notif);
  });
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const {
    notifications,
    loading,
    loadingMore,
    hasMore,
    fetchNotifications,
    fetchMoreNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
  } = useNotificationsStore();

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
      subscribeToRealtime(user.id);
    }
  }, [user?.id]);

  const groupedData = groupNotificationsByDate(notifications);

  const handlePress = (id: number) => {
    markAsRead(id);
  };

  const renderSection = ({ item }: any) => (
    <View>
      <Text
        style={{
          paddingHorizontal: 16,
          paddingVertical: 4,
          color: "#9ca3af",
          fontWeight: "600",
        }}
      >
        {item.title}
      </Text>
      {item.data.map((notif: any) => (
        <NotificationCard
          key={notif.id}
          id={notif.id}
          type={notif.type}
          content={notif.content}
          createdAt={notif.created_at}
          readAt={notif.read_at}
          onPress={handlePress}
        />
      ))}
    </View>
  );

  const loadMore = () => {
    if (hasMore && user?.id && !loadingMore) {
      fetchMoreNotifications(user.id);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{flex: 1}}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={groupedData}
          renderItem={renderSection}
          keyExtractor={(item) => item.title}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : null
          }
        />

        {unreadCount > 0 && (
          <Pressable
            onPress={() => {
              if (user) markAllAsRead(user.id);
            }}
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              backgroundColor: "#2563eb",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Mark all as read ({unreadCount})
            </Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}
