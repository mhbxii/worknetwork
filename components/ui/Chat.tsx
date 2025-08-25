import { useAuth } from "@/store/authStore";
import { useMessagesStore } from "@/store/useMessageStore";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
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
              name={message.is_read ? "check" : "clockcircleo"}
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
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    loading,
    sendingMessage,
    fetchMessages,
    sendMessage,
    subscribeToRealtime,
    reset,
  } = useMessagesStore();

  const [otherUserId, setOtherUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      // ...
      fetchMessages(conversationId, user.id);
      subscribeToRealtime(conversationId);
    }
    return () => {
      reset();
      useMessagesStore.getState().unsubscribeRealtime(conversationId);
    };
  }, [conversationId, user?.id]);
  

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

  const shouldShowTime = (message: any, index: number) => {
    if (index === messages.length - 1) return true;
    const nextMessage = messages[index + 1];
    const timeDiff = dayjs(nextMessage.created_at).diff(
      dayjs(message.created_at),
      "minute"
    );
    return timeDiff > 5 || nextMessage.sender.id !== message.sender_id;
  };

  if (loading && messages.length === 0) {
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#111827" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#1f2937",
          borderBottomWidth: 1,
          borderBottomColor: "#374151",
        }}
      >
        <Pressable onPress={onBack} style={{ marginRight: 12 }}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </Pressable>

        {messages.length > 0 && (
          <>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#374151",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{ color: "#9ca3af", fontSize: 16, fontWeight: "600" }}
              >
                {messages[0]?.sender.id === user?.id
                  ? messages[0]?.receiver.name.charAt(0).toUpperCase()
                  : messages[0]?.sender.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {messages[0]?.sender.id === user?.id
                ? messages[0]?.receiver.name
                : messages[0]?.sender.name}
            </Text>
          </>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
        renderItem={({ item, index }) => (
          <MessageBubble
            message={item}
            isFromMe={item.sender_id === user?.id}
            showTime={shouldShowTime(item, index)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1, paddingVertical: 8 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
    </KeyboardAvoidingView>
  );
}
