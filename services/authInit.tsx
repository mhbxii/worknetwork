import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { fetchUser } from "./userService";

// 1️⃣ Immediately check persisted session on app load
supabase.auth.getSession().then(({ data: { session } }) => {
  const auth = useAuth.getState();
  auth.setSession(session);
  if (session?.user) fetchUser().finally(() => auth.setInitialized(true));
  else {
    auth.setUser(null);
    auth.setInitialized(true);
  }
});

// 2️⃣ Subscribe to future session changes
let subscribed = false;

if (!subscribed) {
  subscribed = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    const auth = useAuth.getState();
    auth.setSession(session);
    if (session?.user) fetchUser();
    else auth.setUser(null);
  });
}
