import { useAuth } from "@/store/authStore";
import { useChatStore } from "@/store/useChatStore";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from "react-native";

interface ChatProps {
  conversationId: string;
  onBack: () => void;
}

interface MessageBubbleProps {
  message: any;
  isFromMe: boolean;
  showTime: boolean;
}

const MessageBubble = ({ message, isFromMe, showTime }: MessageBubbleProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 200 }}
      style={{
        alignSelf: isFromMe ? "flex-end" : "flex-start",
        marginHorizontal: 16,
        marginVertical: 2,
        maxWidth: "80%",
      }}
    >
      <View
        style={{
          backgroundColor: isFromMe ? "#2563eb" : "#374151",
          padding: 12,
          borderRadius: 18,
          borderBottomLeftRadius: !isFromMe ? 4 : 18,
          borderBottomRightRadius: isFromMe ? 4 : 18,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>{message.content}</Text>
      </View>
      {showTime && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
            alignSelf: isFromMe ? "flex-end" : "flex-start",
          }}
        >
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 12,
              marginRight: isFromMe ? 4 : 0,
              marginLeft: !isFromMe ? 4 : 0,
            }}
          >
            {dayjs(message.created_at).format("HH:mm")}
          </Text>
          {isFromMe && (
            <AntDesign
              name={message.is_read ? "check" : "clock-circle"}
              size={12}
              color={message.is_read ? "#10b981" : "#9ca3af"}
            />
          )}
        </View>
      )}
    </MotiView>
  );
};

export default function Chat({ conversationId, onBack }: ChatProps) {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const {
    getConversationMessages,
    messagesLoading,
    messagesHasMore,
    sendingMessage,
    fetchMessages,
    fetchMoreMessages,
    sendMessage,
    markMessagesAsRead,
  } = useChatStore();

  const messages = getConversationMessages(conversationId);
  const isLoading = messagesLoading[conversationId] || false;
  const hasMoreMessages = messagesHasMore[conversationId] || false;

  // Extract other user info from first message for header
  const otherUser =
    messages.length > 0
      ? messages[0]?.sender.id === user?.id
        ? messages[0]?.receiver
        : messages[0]?.sender
      : null;

  // Parse conversation ID to get other user ID for sending messages
  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  useEffect(() => {
    if (conversationId) {
      const [id1, id2] = conversationId.split("-").map(Number);
      const otherId = id1 === user?.id ? id2 : id1;
      setOtherUserId(otherId);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMessages(conversationId, user.id);
      markMessagesAsRead(conversationId, user.id);
    }
  }, [conversationId, user?.id]);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Refresh handler (force reload)
  const handleRefresh = useCallback(() => {
    if (user && user.id) {
      fetchMessages(conversationId, user.id, true);
    }
  }, [user, fetchMessages, conversationId]);

  const handleSend = async () => {
    if (!messageText.trim() || !user?.id || !otherUserId || sendingMessage)
      return;

    const text = messageText.trim();
    setMessageText("");
    await sendMessage(user.id, otherUserId, text);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && user?.id && !isLoading) {
      fetchMoreMessages(conversationId, user.id);
    }
  };

  const shouldShowTime = (message: any, index: number) => {
    if (index === messages.length - 1) return true;
    const nextMessage = messages[index + 1];
    const timeDiff = dayjs(nextMessage.created_at).diff(
      dayjs(message.created_at),
      "minute"
    );
    return timeDiff > 5 || nextMessage.sender.id !== message.sender_id;
  };

  if (isLoading && messages.length === 0) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={{ flex: 1, paddingTop: 90, }}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isFromMe={item.sender_id === user?.id}
              showTime={shouldShowTime(item, index)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          style={{ 
            flex: 1, 
            paddingVertical: 8,
            marginBottom: keyboardHeight > 0 ? 80 : 0,
          }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          inverted={false}
          ListHeaderComponent={
            hasMoreMessages ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: "#1f2937",
            borderTopWidth: 1,
            borderTopColor: "#374151",
          }}
        >
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            style={{
              flex: 1,
              backgroundColor: "#374151",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: "#fff",
              fontSize: 16,
              marginRight: 8,
            }}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!messageText.trim() || sendingMessage}
            style={{
              backgroundColor: messageText.trim() ? "#2563eb" : "#374151",
              borderRadius: 20,
              padding: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={messageText.trim() ? "#fff" : "#9ca3af"}
              />
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}