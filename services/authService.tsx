// services/authService.ts
import { useAuth } from "@/store/authStore";
import { supabase } from "../lib/supabase";
import { fetchUser } from "./userService";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);

  // Set session immediately, then fetch user data
  useAuth.getState().setSession(data.session);

  await fetchUser();
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
    await alert('hello')
}


export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "worknetwork://auth", // Deep link from app.json
      queryParams: {
        access_type: "offline",
        prompt: "consent", // ensures refresh token for longer sessions
      },
    },
  });

  if (error) {
    console.error("Google Sign-in Error:", error.message);
    return error.message;
  }

  return null; // OAuth is a redirect flow; session handled on return
}

export async function signOut() {
  await supabase.auth.signOut();
  useAuth.getState().clearAuth();
}
