import { Notification } from "@/types/entities";
import { create } from "zustand";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 20;

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (userId: number, force?: boolean) => Promise<void>;
  fetchMoreNotifications: (userId: number) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  subscribeToRealtime: (userId: number) => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: false,
  loadingMore: false,
  page: 0,
  hasMore: true,
  error: null,

  fetchNotifications: async (userId, force = false) => {
    if (!userId) return;
    const state = get();
    if (state.loading && !force) return;

    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      set({
        notifications: data || [],
        loading: false,
        page: 1,
        hasMore: (data?.length || 0) === PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      set({ loading: false, error: err.message });
    }
  },

  fetchMoreNotifications: async (userId) => {
    const state = get();
    if (state.loadingMore || !state.hasMore) return;

    try {
      set({ loadingMore: true });

      const from = state.page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      set({
        notifications: [...state.notifications, ...(data || [])],
        loadingMore: false,
        page: state.page + 1,
        hasMore: (data?.length || 0) === PAGE_SIZE,
      });
    } catch (err: any) {
      console.error("Error fetching more notifications:", err);
      set({ loadingMore: false, error: err.message });
    }
  },

  markAsRead: async (id) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
      }));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  },

  subscribeToRealtime: (userId) => {
    supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `target_user_id=eq.${userId}`,
        },
        (payload) => {
          set((state) => ({
            notifications: [payload.new as Notification, ...state.notifications],
          }));
        }
      )
      .subscribe();
  },

  reset: () =>
    set({
      notifications: [],
      loading: false,
      loadingMore: false,
      page: 0,
      hasMore: true,
      error: null,
    }),
}));
