import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { hasGoogleIdentity, loadGoogleProfile, startGoogleAuth } from "@/lib/google-auth";
import { registerProfile } from "@/lib/profile-registration";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  ready: boolean;
  userId: string | null;
  name: string | null;
  googleConnected: boolean;
  email: string | null;
  signInWithGoogle: () => Promise<void>;
  register: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOutAndForget: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ userId: string | null; name: string | null }>({
    userId: null,
    name: null,
  });
  const [profileRevision, setProfileRevision] = useState(0);
  const profileRequest = useRef(0);
  const registering = useRef(false);
  const queryClient = useQueryClient();
  const name = profile.userId === userId ? profile.name : null;
  const ready = sessionReady && (!userId || profile.userId === userId);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;
    const initialVersion = authEventVersion;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED"))
        return;
      authEventVersion += 1;
      // Keep the form mounted while signup saves its profile (including on failure).
      if (registering.current) return;
      setAuthUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      if (!session?.user) queryClient.clear();
      if (event === "USER_UPDATED" || event === "SIGNED_IN")
        setProfileRevision((value) => value + 1);
      // Fetch the profile in a React effect, after the auth callback has returned.
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active && authEventVersion === initialVersion) {
          setAuthUser(data.session?.user ?? null);
          setUserId(data.session?.user.id ?? null);
        }
      })
      .catch((error) => {
        console.error("Could not restore your session", error);
      })
      .finally(() => {
        if (active) setSessionReady(true);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const request = ++profileRequest.current;
    void (async () => {
      try {
        // OAuth profiles are created in the existing profiles table, with the same ID.
        const saved = authUser
          ? await loadGoogleProfile(supabase, authUser)
          : await (async () => {
              const { data, error } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", userId)
                .maybeSingle();
              if (error) throw error;
              return { userId, name: data?.name ?? null };
            })();
        if (active && request === profileRequest.current) setProfile(saved);
      } catch (error) {
        console.error("Could not load your profile", error);
        if (active && request === profileRequest.current) setProfile({ userId, name: null });
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, authUser, profileRevision]);

  const register = async (rawName: string) => {
    if (registering.current) return;
    registering.current = true;
    try {
      const saved = await registerProfile(supabase, rawName);
      // Ignore lookups started before this save; an empty stale result must not undo it.
      profileRequest.current += 1;
      setProfile(saved);
      setUserId(saved.userId);
      setSessionReady(true);
    } finally {
      registering.current = false;
    }
  };

  const updateName = async (rawName: string) => {
    if (!userId) return;
    const trimmed = rawName.trim();
    const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", userId);
    if (error) throw error;
    profileRequest.current += 1;
    setProfile({ userId, name: trimmed });
  };

  const signOutAndForget = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthUser(null);
    setUserId(null);
    profileRequest.current += 1;
    setProfile({ userId: null, name: null });
    queryClient.clear();
  };

  const signInWithGoogle = async () => {
    const url = await startGoogleAuth(supabase, window.location.origin, window.sessionStorage);
    window.location.assign(url);
  };

  return (
    <AuthContext.Provider
      value={{
        ready,
        userId,
        name,
        googleConnected: hasGoogleIdentity(authUser),
        email: authUser?.email ?? null,
        signInWithGoogle,
        register,
        updateName,
        signOutAndForget,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
