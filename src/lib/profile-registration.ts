import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";

export function profileErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not save your profile. Please try again.";
  if (/anonymous sign.?ins? (?:are )?disabled/i.test(message)) {
    return "Anonymous sign-in is disabled for this project. Enable it in Supabase Authentication settings to use name-only signup.";
  }
  if (/failed to fetch|fetch failed|networkerror|network request failed/i.test(message)) {
    return "Could not reach the server. Check your connection and try again. Your name has not been lost.";
  }
  return message;
}

/** Keep the same anonymous identity when profile storage fails, so a retry is safe. */
export async function registerProfile(client: SupabaseClient<Database>, rawName: string) {
  const name = rawName.trim();
  if (!name) throw new Error("Please enter your name.");

  const { data: stored, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;

  let id: string;
  if (stored.session) {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Your session could not be verified. Please try again.");
    id = data.user.id;
  } else {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error("Sign-in did not return a session. Please try again.");
    }
    id = data.user.id;
  }

  const { data: profile, error } = await client
    .from("profiles")
    .upsert({ id, name }, { onConflict: "id" })
    .select("name")
    .single();
  if (error) throw error;
  if (!profile?.name)
    throw new Error("Your profile was not returned after saving. Please try again.");
  return { userId: id, name: profile.name };
}
