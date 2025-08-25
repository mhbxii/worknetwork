import { Conversation, Message, MetaOption } from "@/types/entities";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 20;

interface ConversationsState {
  conversations: Conversation[];
  conversationsChannel?: RealtimeChannel | null;
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchConversations: (user: MetaOption, force?: boolean) => Promise<void>;
  fetchMoreConversations: (user: MetaOption) => Promise<void>;
  subscribeToRealtime: (user: MetaOption) => void;
  unsubscribeRealtime: () => void;
  reset: () => void;
}

// Helper to create conversation ID
const createConversationId = (userId1: number, userId2: number) => {
  const [smaller, larger] = [userId1, userId2].sort((a, b) => a - b);
  return `${smaller}-${larger}`;
};

// Helper to group messages into conversations
const groupMessagesIntoConversations = (
  messages: Message[],
  currentUser: MetaOption
): Conversation[] => {
  const conversationMap = new Map<string, Conversation>();

  messages.forEach((message) => {
    const otherUser: MetaOption =
      message.sender.id === currentUser.id ? message.receiver : message.sender;
    const conversationId = createConversationId(currentUser.id, otherUser.id);

    const existing = conversationMap.get(conversationId);

    if (
      !existing ||
      new Date(message.created_at) > new Date(existing.last_message.created_at)
    ) {
      // Count unread messages (received by current user and not read)
      const unreadCount = messages.filter(
        (m) =>
          ((m.sender.id === otherUser.id && m.receiver.id === currentUser.id) ||
            (m.sender.id === currentUser.id &&
              m.receiver.id === otherUser.id)) &&
          m.receiver.id === currentUser.id &&
          !m.is_read
      ).length;

      conversationMap.set(conversationId, {
        id: conversationId,
        participants: [currentUser, otherUser].sort((a, b) => a.id - b.id),
        last_message: message,
        unread_count: unreadCount,
        updated_at: message.created_at,
      });
    }
  });

  return Array.from(conversationMap.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
};

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  conversationsChannel: null,
  loading: false,
  loadingMore: false,
  page: 0,
  hasMore: true,
  error: null,

  fetchConversations: async (user: MetaOption, force = false) => {
    if (!user || !user.id) return;
    const state = get();
    if (state.loading && !force) return;

    try {
      set({ loading: true, error: null });

      // Join with users table to get names
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:users!sender_id(id, name),
          receiver:users!receiver_id(id, name)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const conversations = groupMessagesIntoConversations(data || [], user);

      set({
        conversations: conversations.slice(0, PAGE_SIZE),
        loading: false,
        page: 1,
        hasMore: conversations.length === PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      set({ loading: false, error: err.message });
    }
  },

  fetchMoreConversations: async (user: MetaOption) => {
    const state = get();
    if (state.loadingMore || !state.hasMore) return;

    try {
      set({ loadingMore: true });

      // Similar logic but with offset
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const allConversations = groupMessagesIntoConversations(data || [], user);
      const from = state.page * PAGE_SIZE;
      const newConversations = allConversations.slice(from, from + PAGE_SIZE);

      set({
        conversations: [...state.conversations, ...newConversations],
        loadingMore: false,
        page: state.page + 1,
        hasMore: newConversations.length === PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching more conversations:", err);
      set({ loadingMore: false, error: err.message });
    }
  },

  subscribeToRealtime: (user) => {
    if (!user?.id) return;
    const state = get();
    if (state.conversationsChannel) return; // already subscribed

    const ch = supabase.channel(`conversations-${user.id}`);

    // Listen where current user is sender
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${user.id}`,
      },
      () => get().fetchConversations(user, true)
    );

    // ...or receiver
    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      },
      () => get().fetchConversations(user, true)
    );

    ch.subscribe();
    console.log("Subscribed to messages channel conversation");
    set({ conversationsChannel: ch });
  },

  unsubscribeRealtime: () => {
    const ch = get().conversationsChannel;
    if (ch) {
      supabase.removeChannel(ch);
      set({ conversationsChannel: null });
      console.log("Unsubscribed from messages channel conversation");
    }
  },

  reset: () => {
    get().unsubscribeRealtime();
    set({
      conversations: [],
      loading: false,
      loadingMore: false,
      page: 0,
      hasMore: true,
      error: null,
    });
  },
}));
