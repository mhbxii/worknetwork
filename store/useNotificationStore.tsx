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
  viewedProposalIds: Set<number>;
  markProposalViewedLocally: (proposalId: number) => void;

  // General send (enforce allowed types). jobId optional (for dedupe).
  sendNotification: (
    targetUserId: number,
    type: "virgin" | "viewed",
    content: string,
    jobId?: number
  ) => Promise<void>;

  // Specific helper for job-viewed case
  sendJobViewedNotification: (
    targetUserId: number,
    jobId: number,
    proposalId?: number
  ) => Promise<void>;
  isProposalViewed: (proposalId: number) => boolean;
  fetchNotifications: (userId: number, force?: boolean) => Promise<void>;
  fetchMoreNotifications: (userId: number) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: (userId: number) => Promise<void>;
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
  viewedProposalIds: new Set<number>(),

  markProposalViewedLocally: (proposalId: number) => {
    if (!proposalId) return;
    set((state) => {
      // clone the Set to keep immutability semantics
      const next = new Set(state.viewedProposalIds);
      next.add(proposalId);
      return { viewedProposalIds: next };
    });
  },


  isProposalViewed: (proposalId: number) => {
    const { viewedProposalIds } = get();
    return viewedProposalIds.has(proposalId);
  },

  // --------------------
  // General send
  // --------------------
  sendNotification: async (targetUserId, type, content, jobId) => {
    if (!targetUserId) return;
    if (!["virgin", "viewed"].includes(type)) {
      console.log("sendNotification: invalid type", type);
      return;
    }

    // keep the jobToken hack you insisted on
    const jobToken = jobId ? ` [job:${jobId}]` : "";
    const finalContent = `${content}${jobToken}`;

    try {
      // If jobId provided, check existence to avoid duplicate sends
      if (jobId) {
        const { data: existing, error: checkErr } = await supabase
          .from("notifications")
          .select("id")
          .eq("target_user_id", targetUserId)
          .ilike("content", `%[job:${jobId}]%`)
          .limit(1);

        if (checkErr) {
          console.log("sendNotification check error:", checkErr);
          // continue and attempt insert (we don't want to silently drop)
        } else if (existing && existing.length > 0) {
          console.log(
            `Notification for target ${targetUserId} and job ${jobId} already sent`
          );
          return;
        }
      }

      // optimistic UI update with temp negative id
      const tempId = -Date.now();
      const createdAt = new Date().toISOString();
      set((state) => ({
        notifications: [
          {
            id: tempId,
            target_user_id: targetUserId,
            type,
            content: finalContent,
            created_at: createdAt,
            read_at: null,
          } as Notification,
          ...state.notifications,
        ],
      }));

      // Insert into DB (client-side; you said RLS allows this)
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          target_user_id: targetUserId,
          type,
          content: finalContent,
        })
        .select();

      if (error) {
        console.log("Error sending notification:", error);
        return;
      }

      const inserted =
        Array.isArray(data) && data[0] ? (data[0] as Notification) : undefined;
      if (inserted) {
        set((state) => ({
          notifications: [
            inserted,
            ...state.notifications.filter((n) => n.id !== tempId),
          ],
        }));
      }
    } catch (err: any) {
      console.log("sendNotification caught:", err);
    }
  },

  // --------------------
  // Specific helper: job viewed
  // --------------------
  sendJobViewedNotification: async (targetUserId, jobId, proposalId) => {
    if (!targetUserId || !jobId) return;

    const content = proposalId
      ? `Your proposal for job: #${jobId} was viewed by a recruiter`
      : `Your proposal was viewed by a recruiter`;

    // use the general sender with jobId for dedupe
    await get().sendNotification(targetUserId, "viewed", content, jobId);
  },

  // --------------------
  // Existing methods (unchanged logic)
  // --------------------
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
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (!notif || notif.read_at) {
          return state;
        }
        const updatedNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        );

        supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", id)
          .then(({ error }) => {
            if (error)
              console.error("Error marking notification as read:", error);
          });

        return { notifications: updatedNotifications };
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  },

  markAllAsRead: async (userId: number) => {
    try {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.read_at ? n : { ...n, read_at: new Date().toISOString() }
        ),
      }));

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("target_user_id", userId)
        .is("read_at", null);

      if (error) throw error;
    } catch (err) {
      console.error("Error marking all as read:", err);
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
            notifications: [
              payload.new as Notification,
              ...state.notifications,
            ],
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
