import { Conversation, Message, MetaOption } from "@/types/entities";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

const CONVERSATIONS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 50;

interface ChatState {
  // Raw data - messages organized by conversation
  messagesByConversation: Record<string, Message[]>;

  // Conversations derived from messages
  conversations: Conversation[];

  // Pagination & loading states
  conversationsPage: number;
  conversationsHasMore: boolean;
  conversationsLoading: boolean;

  messagesPage: Record<string, number>; // conversationId -> page
  messagesHasMore: Record<string, boolean>; // conversationId -> hasMore
  messagesLoading: Record<string, boolean>; // conversationId -> loading

  // UI state
  currentConversation: string | null;
  currentUser: MetaOption | null;
  sendingMessage: boolean;

  // Realtime
  realtimeChannel: RealtimeChannel | null;

  // Error handling
  error: string | null;

  // Actions
  setCurrentUser: (user: MetaOption) => void;
  setCurrentConversation: (conversationId: string | null) => void;

  // Data fetching
  fetchConversations: (user: MetaOption, force?: boolean) => Promise<void>;
  fetchMoreConversations: (user: MetaOption) => Promise<void>;
  fetchMessages: (
    conversationId: string,
    userId: number,
    force?: boolean
  ) => Promise<void>;
  fetchMoreMessages: (conversationId: string, userId: number) => Promise<void>;

  // Message actions
  sendMessage: (
    senderId: number,
    receiverId: number,
    content: string
  ) => Promise<void>;
  markMessagesAsRead: (conversationId: string, userId: number) => Promise<void>;

  // Realtime
  subscribeToRealtime: (userId: number) => void;
  unsubscribeRealtime: () => void;

  // Selectors
  getConversationMessages: (conversationId: string) => Message[];
  getUnreadCount: (conversationId: string, userId: number) => number;
  getTotalUnreadMessages: (userId: number) => number;

  // Cleanup
  reset: () => void;
}

// Helper functions
const createConversationId = (userId1: number, userId2: number): string => {
  const [smaller, larger] = [userId1, userId2].sort((a, b) => a - b);
  return `${smaller}-${larger}`;
};

const parseConversationId = (conversationId: string) => {
  const [id1, id2] = conversationId.split("-").map(Number);
  return { user1: id1, user2: id2 };
};

const groupMessagesIntoConversations = (
  messagesByConversation: Record<string, Message[]>,
  currentUser: MetaOption
): Conversation[] => {
  const conversations: Conversation[] = [];

  Object.entries(messagesByConversation).forEach(
    ([conversationId, messages]) => {
      if (!messages || messages.length === 0) return;

      // Get the latest message
      const lastMessage = messages[messages.length - 1];

      // Find the other user
      const otherUser: MetaOption =
        lastMessage.sender.id === currentUser.id
          ? lastMessage.receiver
          : lastMessage.sender;

      // Count unread messages (received by current user and not read)
      const unreadCount = messages.filter(
        (msg) => msg.receiver.id === currentUser.id && !msg.is_read
      ).length;

      conversations.push({
        id: conversationId,
        participants: [currentUser, otherUser].sort((a, b) => a.id - b.id),
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: lastMessage.created_at,
      });
    }
  );

  // Sort by most recent message
  return conversations.sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
};

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messagesByConversation: {},
  conversations: [],
  conversationsPage: 0,
  conversationsHasMore: true,
  conversationsLoading: false,
  messagesPage: {},
  messagesHasMore: {},
  messagesLoading: {},
  currentConversation: null,
  currentUser: null,
  sendingMessage: false,
  realtimeChannel: null,
  error: null,

  // Basic setters
  setCurrentUser: (user: MetaOption) => {
    set({ currentUser: user });
  },

  setCurrentConversation: (conversationId: string | null) => {
    set({ currentConversation: conversationId });
  },

  // Fetch conversations (initial load)
  fetchConversations: async (user: MetaOption, force = false) => {
    if (!user?.id) return;

    const state = get();
    if (state.conversationsLoading && !force) return;

    try {
      set({ conversationsLoading: true, error: null, currentUser: user });

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
        .limit(1000); // Get enough messages to build conversations

      if (error) throw error;

      // Group messages by conversation
      const messagesByConversation: Record<string, Message[]> = {};

      (data || []).forEach((message) => {
        const conversationId = createConversationId(
          message.sender_id,
          message.receiver_id
        );

        if (!messagesByConversation[conversationId]) {
          messagesByConversation[conversationId] = [];
        }

        messagesByConversation[conversationId].push(message);
      });

      // Sort messages in each conversation by date (oldest first)
      Object.keys(messagesByConversation).forEach((conversationId) => {
        messagesByConversation[conversationId].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      const conversations = groupMessagesIntoConversations(
        messagesByConversation,
        user
      );

      set({
        messagesByConversation,
        conversations: conversations.slice(0, CONVERSATIONS_PAGE_SIZE),
        conversationsLoading: false,
        conversationsPage: 1,
        conversationsHasMore: conversations.length === CONVERSATIONS_PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      set({ conversationsLoading: false, error: err.message });
    }
  },

  // Fetch more conversations (pagination)
  fetchMoreConversations: async (user: MetaOption) => {
    const state = get();
    if (state.conversationsLoading || !state.conversationsHasMore) return;

    try {
      set({ conversationsLoading: true });

      // Re-derive conversations from existing data and paginate
      const allConversations = groupMessagesIntoConversations(
        state.messagesByConversation,
        user
      );

      const from = state.conversationsPage * CONVERSATIONS_PAGE_SIZE;
      const newConversations = allConversations.slice(
        from,
        from + CONVERSATIONS_PAGE_SIZE
      );

      set({
        conversations: [...state.conversations, ...newConversations],
        conversationsLoading: false,
        conversationsPage: state.conversationsPage + 1,
        conversationsHasMore:
          newConversations.length === CONVERSATIONS_PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching more conversations:", err);
      set({ conversationsLoading: false, error: err.message });
    }
  },

  // Fetch messages for specific conversation
  fetchMessages: async (
    conversationId: string,
    userId: number,
    force = false
  ) => {
    if (!conversationId || !userId) return;

    const state = get();
    if (state.messagesLoading[conversationId] && !force) return;

    try {
      set({
        messagesLoading: { ...state.messagesLoading, [conversationId]: true },
        error: null,
        currentConversation: conversationId,
      });

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
        .range(0, MESSAGES_PAGE_SIZE - 1);

      if (error) throw error;

      const messages = (data || []).reverse();

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
        messagesPage: { ...state.messagesPage, [conversationId]: 1 },
        messagesHasMore: {
          ...state.messagesHasMore,
          [conversationId]: (data?.length || 0) === MESSAGES_PAGE_SIZE,
        },
      }));

      // Mark messages as read
      get().markMessagesAsRead(conversationId, userId);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      set((state) => ({
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
        error: err.message,
      }));
    }
  },

  // Fetch more messages for conversation (pagination)
  fetchMoreMessages: async (conversationId: string, userId: number) => {
    const state = get();
    if (
      state.messagesLoading[conversationId] ||
      !state.messagesHasMore[conversationId] ||
      !state.messagesByConversation[conversationId]
    )
      return;

    try {
      set({
        messagesLoading: { ...state.messagesLoading, [conversationId]: true },
      });

      const currentPage = state.messagesPage[conversationId] || 1;
      const { user1, user2 } = parseConversationId(conversationId);
      const from = currentPage * MESSAGES_PAGE_SIZE;
      const to = from + MESSAGES_PAGE_SIZE - 1;

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
        .range(from, to);

      if (error) throw error;

      const olderMessages = (data || []).reverse();
      const existingMessages =
        state.messagesByConversation[conversationId] || [];

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: [...olderMessages, ...existingMessages],
        },
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
        messagesPage: {
          ...state.messagesPage,
          [conversationId]: currentPage + 1,
        },
        messagesHasMore: {
          ...state.messagesHasMore,
          [conversationId]: (data?.length || 0) === MESSAGES_PAGE_SIZE,
        },
      }));
    } catch (err: any) {
      console.error("Error fetching more messages:", err);
      set((state) => ({
        messagesLoading: { ...state.messagesLoading, [conversationId]: false },
        error: err.message,
      }));
    }
  },

  // Send message
  sendMessage: async (
    senderId: number,
    receiverId: number,
    content: string
  ) => {
    if (!content.trim()) return;

    const conversationId = createConversationId(senderId, receiverId);

    try {
      set({ sendingMessage: true });

      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
        })
        .select(
          `
          *,
          sender:users!sender_id(id, name),
          receiver:users!receiver_id(id, name)
        `
        )
        .single();

      if (error) throw error;

      // Optimistically add to local state
      set((state) => {
        const existingMessages =
          state.messagesByConversation[conversationId] || [];
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...existingMessages, data],
          },
          sendingMessage: false,
        };
      });

      // Refresh conversations to update last message and order
      const state = get();
      if (state.currentUser) {
        const updatedConversations = groupMessagesIntoConversations(
          state.messagesByConversation,
          state.currentUser
        );
        set({
          conversations: updatedConversations.slice(
            0,
            state.conversationsPage * CONVERSATIONS_PAGE_SIZE
          ),
        });
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      set({ sendingMessage: false, error: err.message });
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string, userId: number) => {
    try {
      const { user1, user2 } = parseConversationId(conversationId);

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
      set((state) => {
        const existingMessages =
          state.messagesByConversation[conversationId] || [];
        const updatedMessages = existingMessages.map((msg) =>
          msg.receiver.id === userId && !msg.is_read
            ? { ...msg, is_read: true }
            : msg
        );

        const updatedMessagesByConversation = {
          ...state.messagesByConversation,
          [conversationId]: updatedMessages,
        };

        // Update conversations to reflect new unread counts
        const updatedConversations = state.currentUser
          ? groupMessagesIntoConversations(
              updatedMessagesByConversation,
              state.currentUser
            )
          : state.conversations;

        return {
          messagesByConversation: updatedMessagesByConversation,
          conversations: updatedConversations.slice(
            0,
            state.conversationsPage * CONVERSATIONS_PAGE_SIZE
          ),
        };
      });
    } catch (err: any) {
      console.error("Error marking messages as read:", err);
    }
  },

  // Subscribe to realtime updates
  // Subscribe to realtime updates
  subscribeToRealtime: (userId: number) => {
    const state = get();
    if (state.realtimeChannel || !userId) return;

    const channel = supabase.channel(`chat-${userId}`);
    console.log("Subscribing to chat realtime for user:", userId);

    const convIdFromRow = (row: any) => {
      const sid = row.sender_id ?? row.sender?.id;
      const rid = row.receiver_id ?? row.receiver?.id;
      if (!sid || !rid) return null;
      return createConversationId(Number(sid), Number(rid));
    };

    const upsertMessageRow = async (row: any, isUpdate = false) => {
      try {
        if (!row || !row.id) {
          console.warn("RT: missing row or id", row);
          return;
        }

        const conversationId = convIdFromRow(row);
        if (!conversationId) {
          console.warn("RT: could not build conversationId from row", row);
          return;
        }

        // Fetch enriched message (joined sender/receiver)
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
              *,
              sender:users!sender_id(id, name),
              receiver:users!receiver_id(id, name)
            `
          )
          .eq("id", row.id)
          .single();

        if (error) {
          console.warn("RT: failed to select full message", error);
          return;
        }
        if (!data) return;

        set((state) => {
          const existingMessages =
            state.messagesByConversation[conversationId] || [];

          // dedupe
          const exists = existingMessages.some(
            (m) => String(m.id) === String(data.id)
          );

          let updatedMessages;
          if (isUpdate) {
            // replace if exists, else append
            updatedMessages = exists
              ? existingMessages.map((m) =>
                  String(m.id) === String(data.id) ? data : m
                )
              : [...existingMessages, data];
          } else {
            if (exists) return state; // nothing to do
            updatedMessages = [...existingMessages, data];
          }

          const updatedMessagesByConversation = {
            ...state.messagesByConversation,
            [conversationId]: updatedMessages,
          };

          const updatedConversations = state.currentUser
            ? groupMessagesIntoConversations(
                updatedMessagesByConversation,
                state.currentUser
              )
            : state.conversations;

          return {
            messagesByConversation: updatedMessagesByConversation,
            conversations: updatedConversations.slice(
              0,
              state.conversationsPage * CONVERSATIONS_PAGE_SIZE
            ),
          };
        });
      } catch (e) {
        console.error("RT upsert error", e);
      }
    };

    // Two INSERT listeners (sender OR receiver)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        // only accept rows intended for chat (safety)
        const row = payload.new;
        if (!row) return;
        // optional: ensure it's for this conversation by checking receiver_id presence
        upsertMessageRow(row, false);
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        upsertMessageRow(row, false);
      }
    );

    // Two UPDATE listeners (read status, edits)
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `sender_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        upsertMessageRow(row, true);
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        upsertMessageRow(row, true);
      }
    );

    // subscribe + store channel
    channel.subscribe();
    set({ realtimeChannel: channel });
    console.log("Subscribed to chat realtime updates");
  },

  // Unsubscribe from realtime
  unsubscribeRealtime: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null });
      console.log("Unsubscribed from chat realtime updates");
    }
  },

  // Selectors
  getConversationMessages: (conversationId: string): Message[] => {
    return get().messagesByConversation[conversationId] || [];
  },

  getUnreadCount: (conversationId: string, userId: number): number => {
    const messages = get().messagesByConversation[conversationId] || [];
    return messages.filter((msg) => msg.receiver.id === userId && !msg.is_read)
      .length;
  },

  getTotalUnreadMessages: (userId: number): number => {
    const state = get();
    let total = 0;

    Object.values(state.messagesByConversation).forEach((messages) => {
      total += messages.filter(
        (msg) => msg.receiver.id === userId && !msg.is_read
      ).length;
    });

    return total;
  },

  // Reset store
  reset: () => {
    get().unsubscribeRealtime();
    set({
      messagesByConversation: {},
      conversations: [],
      conversationsPage: 0,
      conversationsHasMore: true,
      conversationsLoading: false,
      messagesPage: {},
      messagesHasMore: {},
      messagesLoading: {},
      currentConversation: null,
      currentUser: null,
      sendingMessage: false,
      realtimeChannel: null,
      error: null,
    });
  },
}));
