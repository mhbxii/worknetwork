import { supabase } from "@/lib/supabase";
import { fetchUser } from "@/services/userService";
import { useAuth } from "@/store/authStore";

export function initAuth() {
  const auth = useAuth.getState();
  let firstAuthChange = true; // 🚀 prevents duplicate fetch

  // 1️⃣ Load existing session first
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    auth.setSession(session);

    if (session?.user) {
      await fetchUser();
    } else {
      auth.setUser(null);
      auth.setProfile(null);
    }

    auth.setInitialized(true);
  });

  // 2️⃣ Listen for auth changes
  const { data: subscription } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (firstAuthChange) {
        firstAuthChange = false;
        return; // ⛔ skip first duplicate trigger
      }

      auth.setSession(session);

      if (session?.user) {
        await fetchUser();
      } else {
        auth.setUser(null);
        auth.setProfile(null);
      }
    }
  );

  // 3️⃣ Cleanup
  return () => {
    subscription?.subscription?.unsubscribe();
  };
}
