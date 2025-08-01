import { supabase } from "../lib/supabase";
import { useAuth } from "../store/authStore";

export async function fetchUser() {
  const session = useAuth.getState().session;
  if (!session?.user) return;

  const { data, error } = await supabase
    .from("users") // lowercase table name (usually)
    .select("*")
    .eq("supabase_user_id", session.user.id)
    .single();

  if (!error && data) useAuth.getState().setUser(data);
}

// New: fetch supabase session & user from DB and update Zustand
export async function loadSessionAndUser() {
  const { data: { session } } = await supabase.auth.getSession();

  const auth = useAuth.getState();

  if (session) {
    auth.setSession(session);
    await fetchUser();
  } else {
    auth.clearAuth();
  }
}
