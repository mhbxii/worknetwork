// Messages.tsx — replace your current file with this
import Chat from "@/components/ui/Chat";
import { useAuth } from "@/store/authStore";
import { useChatStore } from "@/store/useChatStore";
import { MetaOption } from "@/types/entities";
import { AntDesign } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

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
  const otherUser: MetaOption = conversation.participants.find(
    (p: MetaOption) => p.id !== user?.id
  );

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
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            {otherUser?.name?.charAt(0).toUpperCase() || "U"}
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
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
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
                {conversation.unread_count > 99
                  ? "99+"
                  : conversation.unread_count}
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
  const navigation = useNavigation();
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  const {
    conversations,
    conversationsLoading,
    conversationsHasMore,
    fetchConversations,
    fetchMoreConversations,
    setCurrentConversation,
  } = useChatStore();

  // Navigation header control: compute current chat participant
  const currentConversation = selectedConversation
    ? conversations.find((c: any) => c.id === selectedConversation)
    : null;
  const currentOtherUser = currentConversation
    ? currentConversation.participants.find((p: any) => p.id !== user?.id)
    : null;

  // Set header depending on view
  useLayoutEffect(() => {
    if (currentView === "chat" && selectedConversation && currentOtherUser) {
      navigation.setOptions({
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1f2937",
          borderBottomWidth: 1,
          borderBottomColor: "#374151",
        },
        headerTintColor: "#fff",
        headerTitle: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#374151",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#9ca3af", fontSize: 14, fontWeight: "600" }}
              >
                {currentOtherUser?.name
                  ? currentOtherUser.name.charAt(0).toUpperCase()
                  : "U"}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 10,
                maxWidth: 200,
              }}
            >
              {currentOtherUser?.name ?? "Chat"}
            </Text>
          </View>
        ),
        headerLeft: () => (
          <Pressable onPress={handleBackToList} style={{ marginLeft: 12 }}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </Pressable>
        ),
      });
    } else {
      // restore default header for messages list
      navigation.setOptions({
        headerShown: true,
        headerTitle: "Messages",
        headerLeft: undefined,
        headerStyle: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, currentView, selectedConversation, conversations, user?.id]);

  // Refresh handler (force reload)
  const handleRefresh = useCallback(() => {
    if (user && user.id) {
      fetchConversations({ id: user.id, name: user.name }, true);
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
    if (conversationsHasMore && user?.id && !conversationsLoading) {
      fetchMoreConversations({ id: user.id, name: user.name });
    }
  };

  if (currentView === "chat" && selectedConversation) {
    return (
      <Chat conversationId={selectedConversation} onBack={handleBackToList} />
    );
  }

  if (conversationsLoading && conversations.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#111827",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
      <View style={{ flex: 1}}>
        <FlatList
          data={conversations}
          refreshControl={
            <RefreshControl
              refreshing={conversationsLoading}
              onRefresh={handleRefresh}
            />
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
            conversationsLoading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !conversationsLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: 100,
                }}
              >
                <Text style={{ color: "#9ca3af", fontSize: 16 }}>
                  No conversations yet
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </LinearGradient>
  );
}
