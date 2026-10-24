import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";

export const GOOGLE_LINK_KEY = "vin-google-link-user";
type LinkStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function hasGoogleIdentity(user: User | null): boolean {
  return (
    !!user &&
    (user.identities?.some((identity) => identity.provider === "google") === true ||
      user.app_metadata?.providers?.includes("google") === true)
  );
}

export function googleAuthErrorMessage(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "Google sign-in could not be completed. Please try again.";
  if (/identity.*already|already.*linked|already.*registered/i.test(message))
    return "This Google account is already connected to another profile. Your current tasks are unchanged. Use a different Google account to connect this profile.";
  if (/manual.*link|linking.*disabled/i.test(message))
    return "Connecting this profile requires manual identity linking to be enabled in Supabase Authentication settings.";
  if (/provider.*(?:disabled|not enabled|not supported)|unsupported provider/i.test(message))
    return "Google sign-in is not enabled for this project yet. Check the Google provider in Supabase Authentication settings.";
  if (/access_denied|cancelled|canceled/i.test(message))
    return "Google sign-in was cancelled. You can try again.";
  if (/failed to fetch|fetch failed|networkerror|network request failed/i.test(message))
    return "Could not reach the sign-in server. Check your connection and try again.";
  if (/code.verifier|pkce|flow.*expired|authorization code.*expired/i.test(message))
    return "This sign-in link has expired or was opened in a different browser. Start Google sign-in again in this browser.";
  return message;
}

/** Link signed-in users instead of switching accounts and leaving their data behind. */
export async function startGoogleAuth(
  client: SupabaseClient<Database>,
  origin: string,
  storage: LinkStorage,
) {
  const redirectTo = new URL("/auth/callback", origin).href;
  const options = {
    redirectTo,
    skipBrowserRedirect: true,
    queryParams: { prompt: "select_account" },
  };
  const { data: stored, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  storage.removeItem(GOOGLE_LINK_KEY);

  if (stored.session) {
    const { data: verified, error } = await client.auth.getUser();
    if (error) throw error;
    if (!verified.user)
      throw new Error("Your current session could not be verified. Please try again.");
    if (hasGoogleIdentity(verified.user))
      throw new Error("This profile is already connected to Google.");
    storage.setItem(GOOGLE_LINK_KEY, verified.user.id);
    try {
      const { data, error: linkError } = await client.auth.linkIdentity({
        provider: "google",
        options,
      });
      if (linkError) throw linkError;
      if (!data.url) throw new Error("Google sign-in did not return a redirect URL.");
      return data.url;
    } catch (error) {
      storage.removeItem(GOOGLE_LINK_KEY);
      throw error;
    }
  }
  const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options });
  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in did not return a redirect URL.");
  return data.url;
}

export async function finishGoogleAuth(
  client: SupabaseClient<Database>,
  href: string,
  storage: LinkStorage,
) {
  const url = new URL(href);
  const failure = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (failure) {
    storage.removeItem(GOOGLE_LINK_KEY);
    throw new Error(failure);
  }
  const code = url.searchParams.get("code");
  if (!code) throw new Error("No Google sign-in code was returned. Please start sign-in again.");
  const expectedUser = storage.getItem(GOOGLE_LINK_KEY);
  const flowId = url.searchParams.get("sb_flow_id");
  const { data, error } = await client.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );
  if (error) throw error;
  if (!data.session || !data.user || !hasGoogleIdentity(data.user))
    throw new Error("Google sign-in did not return a connected account. Please try again.");
  if (expectedUser && data.user.id !== expectedUser)
    throw new Error(
      "The connected account did not match your original profile. Your saved data has not been moved or deleted.",
    );
  storage.removeItem(GOOGLE_LINK_KEY);
  return { returnTo: expectedUser ? ("/settings" as const) : ("/" as const) };
}

/** Create only a missing profile; never replace an existing custom name. */
export async function loadGoogleProfile(client: SupabaseClient<Database>, user: User) {
  const read = () => client.from("profiles").select("name").eq("id", user.id).maybeSingle();
  const { data, error } = await read();
  if (error) throw error;
  if (data?.name || !hasGoogleIdentity(user)) return { userId: user.id, name: data?.name ?? null };
  const rawName = user.user_metadata?.["full_name"] || user.user_metadata?.["name"];
  const name =
    typeof rawName === "string" && rawName.trim() ? rawName.trim().slice(0, 80) : "My workspace";
  const { data: created, error: createError } = await client
    .from("profiles")
    .insert({ id: user.id, name })
    .select("name")
    .single();
  if (createError?.code === "23505") {
    const { data: existing, error: readError } = await read();
    if (readError) throw readError;
    if (!existing?.name) throw new Error("Your profile could not be loaded. Please try again.");
    return { userId: user.id, name: existing.name };
  }
  if (createError) throw createError;
  if (!created?.name) throw new Error("Your profile could not be saved. Please try again.");
  return { userId: user.id, name: created.name };
}
