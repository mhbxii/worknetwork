// hooks/useNotifications.ts
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
//import dayjs from "dayjs";

interface Notification {
  id: number;
  target_user_id: number;
  type: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refreshNotifications: () => void;
  fetchMoreNotifications: () => void;
  markAsRead: (id: number) => void;
}

const PAGE_SIZE = 10;

export function useNotifications(userId: number): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const from = reset ? 0 : page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        setNotifications(prev =>
          reset ? data : [...prev, ...data.filter(n => !prev.some(p => p.id === n.id))]
        );
        setHasMore(data.length === PAGE_SIZE);
        if (reset) setPage(1);
        else setPage(prev => prev + 1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, userId]);

  const refreshNotifications = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  const fetchMoreNotifications = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, loadingMore, hasMore, fetchNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, payload => {
        const newNotification = payload.new as Notification;
        if (newNotification.target_user_id === userId) {
          setNotifications(prev => [newNotification, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    refreshNotifications,
    fetchMoreNotifications,
    markAsRead
  };
}
