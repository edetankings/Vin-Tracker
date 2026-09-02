import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  ready: boolean;
  userId: string | null;
  name: string | null;
  register: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOutAndForget: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const loadProfile = async (id: string) => {
      const { data } = await supabase.from("profiles").select("name").eq("id", id).maybeSingle();
      if (!active) return;
      setName(data?.name ?? null);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!active) return;
      if (session?.user) {
        setUserId(session.user.id);
        await loadProfile(session.user.id);
      }
      if (active) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user?.id ?? null);
      if (!session?.user) {
        setName(null);
        queryClient.clear();
        return;
      }
      void loadProfile(session.user.id);
      void queryClient.invalidateQueries();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const register = async (rawName: string) => {
    const trimmed = rawName.trim();
    let id = userId;
    if (!id) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      id = data.user?.id ?? null;
    }
    if (!id) throw new Error("Could not create your profile. Please try again.");
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id, name: trimmed }, { onConflict: "id" });
    if (profileError) throw profileError;
    setUserId(id);
    setName(trimmed);
  };

  const updateName = async (rawName: string) => {
    if (!userId) return;
    const trimmed = rawName.trim();
    const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", userId);
    if (error) throw error;
    setName(trimmed);
  };

  const signOutAndForget = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setName(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ ready, userId, name, register, updateName, signOutAndForget }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
