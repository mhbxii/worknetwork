import Chat from "@/components/ui/Chat";
import { useAuth } from "@/store/authStore";
import { useConversationsStore } from "@/store/useConversationStore";
import { useMessagesStore } from "@/store/useMessageStore";
import { MetaOption } from "@/types/entities";
import { AntDesign } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MotiView } from "moti";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

dayjs.extend(relativeTime);

interface ConversationCardProps {
  conversation: any;
  onPress: () => void;
}

const ConversationCard = ({ conversation, onPress }: ConversationCardProps) => {
  const { user } = useAuth();
  const lastMessage = conversation.last_message;
  const isFromMe = lastMessage.sender.id === user?.id;
  const hasUnread = conversation.unread_count > 0;
  
  // Get other user
  const otherUser:MetaOption = conversation.participants.find((p:MetaOption) => p.id !== user?.id);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: "row",
          padding: 16,
          backgroundColor: "#1f2937",
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#374151",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#9ca3af", fontSize: 18, fontWeight: "600" }}>
            {otherUser?.name.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            {otherUser?.name || "Unknown User"}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isFromMe && (
              <AntDesign 
                name={lastMessage.is_read ? "check" : "clockcircleo"} 
                size={12} 
                color={lastMessage.is_read ? "#10b981" : "#9ca3af"} 
                style={{ marginRight: 4 }} 
              />
            )}
            <Text
              style={{
                color: hasUnread ? "#fff" : "#9ca3af",
                fontSize: 14,
                fontWeight: hasUnread ? "600" : "400",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {lastMessage.content}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>
            {dayjs(lastMessage.created_at).fromNow()}
          </Text>

          {hasUnread && (
            <View
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                minWidth: 20,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
              >
                {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </MotiView>
  );
};

export default function Messages() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const {
    conversations,
    loading,
    loadingMore,
    hasMore,
    fetchConversations,
    fetchMoreConversations,
    subscribeToRealtime: subscribeToConversations,
  } = useConversationsStore();

  const { setCurrentConversation } = useMessagesStore();

  // Refresh handler (force reload)
  const handleRefresh = useCallback(() => {
    if (user && user.id) {
      fetchConversations({id: user.id, name: user.name} as MetaOption, true);
    }
  }, [user, fetchConversations]);

  const handleConversationPress = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentConversation(conversationId);
    setCurrentView("chat");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedConversation(null);
    setCurrentConversation(null);
  };

  const loadMore = () => {
    if (hasMore && user?.id && !loadingMore) {
      fetchMoreConversations({id: user.id, name: user.name} as MetaOption);
    }
  };

  if (currentView === "chat" && selectedConversation) {
    return (
      <Chat
        conversationId={selectedConversation}
        onBack={handleBackToList}
      />
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111827" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111827" }}>
      <FlatList
        data={conversations}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <ConversationCard
            conversation={item}
            onPress={() => handleConversationPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 }}>
              <Text style={{ color: "#9ca3af", fontSize: 16 }}>No conversations yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}