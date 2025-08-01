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
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sign_up`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Signup failed");

  // After signup, immediately sign in user
  await signInWithEmail(email, password);

  return result; // { success: true, user }
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
