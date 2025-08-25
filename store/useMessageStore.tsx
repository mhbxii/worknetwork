import { Message } from "@/types/entities";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 50;

interface MessagesState {
  messages: Message[];
  messageChannels: Record<string, RealtimeChannel | undefined>;
  loading: boolean;
  loadingMore: boolean;
  sendingMessage: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;
  currentConversation: string | null;

  // Actions
  fetchMessages: (
    conversationId: string,
    userId: number,
    force?: boolean
  ) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  sendMessage: (
    senderId: number,
    receiverId: number,
    content: string
  ) => Promise<void>;
  markMessagesAsRead: (conversationId: string, userId: number) => Promise<void>;
  subscribeToRealtime: (conversationId: string) => void;
  unsubscribeRealtime: (conversationId?: string) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  reset: () => void;
}

// Helper to parse conversation ID
const parseConversationId = (conversationId: string) => {
  const [id1, id2] = conversationId.split("-").map(Number);
  return { user1: id1, user2: id2 };
};

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  messageChannels: {},
  loading: false,
  loadingMore: false,
  sendingMessage: false,
  page: 0,
  hasMore: true,
  error: null,
  currentConversation: null,

  setCurrentConversation: (conversationId) => {
    set({ currentConversation: conversationId });
  },

  fetchMessages: async (conversationId, userId, force = false) => {
    if (!conversationId || !userId) return;
    const state = get();
    if (state.loading && !force) return;

    try {
      set({ loading: true, error: null, currentConversation: conversationId });

      const { user1, user2 } = parseConversationId(conversationId);

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!sender_id(id, name),
          receiver:users!receiver_id(id, name)
        `
        )
        .or(
          `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
        )
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      const messages = (data || []).reverse();

      set({
        messages,
        loading: false,
        page: 1,
        hasMore: (data?.length || 0) === PAGE_SIZE,
      });

      get().markMessagesAsRead(conversationId, userId);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      set({ loading: false, error: err.message });
    }
  },

  fetchMoreMessages: async () => {
    const state = get();
    if (state.loadingMore || !state.hasMore || !state.currentConversation)
      return;

    try {
      set({ loadingMore: true });

      const { user1, user2 } = parseConversationId(state.currentConversation);
      const from = state.page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Prepend older messages (reverse order)
      const olderMessages = (data || []).reverse();

      set({
        messages: [...olderMessages, ...state.messages],
        loadingMore: false,
        page: state.page + 1,
        hasMore: (data?.length || 0) === PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching more messages:", err);
      set({ loadingMore: false, error: err.message });
    }
  },

  sendMessage: async (senderId, receiverId, content) => {
    if (!content.trim()) return;

    try {
      set({ sendingMessage: true });

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistically add to messages
      set((state) => ({
        messages: [...state.messages, data],
        sendingMessage: false,
      }));
    } catch (err: any) {
      console.error("Error sending message:", err);
      set({ sendingMessage: false, error: err.message });
    }
  },

  markMessagesAsRead: async (conversationId, userId) => {
    try {
      const { user1, user2 } = parseConversationId(conversationId);

      // Mark all unread messages from the other user as read
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .or(
          `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
        )
        .eq("receiver_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      // Update local state
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.receiver.id === userId && !msg.is_read
            ? { ...msg, is_read: true }
            : msg
        ),
      }));
    } catch (err: any) {
      console.error("Error marking messages as read:", err);
    }
  },

  subscribeToRealtime: (conversationId) => {
    const { user1, user2 } = parseConversationId(conversationId);
    const channels = get().messageChannels;
    if (channels[conversationId]) return; // already subscribed

    const ch = supabase.channel(`messages-${conversationId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `and(sender_id=in.(${user1},${user2}),receiver_id=in.(${user1},${user2}))`,
      },
      (payload) => {
        set((state) => ({
          messages: [...state.messages, payload.new as Message],
        }));
      }
    );

    ch.subscribe();
    set(({ messageChannels }) => ({
      messageChannels: { ...messageChannels, [conversationId]: ch },
    }));
    console.log("Subscribed to conversation", conversationId);
  },

  unsubscribeRealtime: (conversationId) => {
    const channels = get().messageChannels;
    if (conversationId) {
      const ch = channels[conversationId];
      if (ch) supabase.removeChannel(ch);
      set(({ messageChannels }) => {
        const { [conversationId]: _, ...rest } = messageChannels;
        return { messageChannels: rest };
      });
    } else {
      // all
      Object.values(channels).forEach((ch) => ch && supabase.removeChannel(ch));
      set({ messageChannels: {} });
    }
  },

  reset: () => {
    get().unsubscribeRealtime();
    set({
      messages: [],
      loading: false,
      loadingMore: false,
      sendingMessage: false,
      page: 0,
      hasMore: true,
      error: null,
      currentConversation: null,
    });
  },
}));
