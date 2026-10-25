import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  LOCAL_DATA_KEY,
  LOCAL_DATA_EVENT,
  readLocalData,
  saveLocalProfile,
  resetLocalData,
  storageErrorMessage,
  type LocalProfile,
} from "@/lib/local-store";

type AuthContextValue = {
  ready: boolean;
  userId: string | null;
  name: string | null;
  storageError: string | null;
  retryStorage: () => void;
  register: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  resetLocalData: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

/** Local profile only: no remote account or network request is needed. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const queryClient = useQueryClient();
  useEffect(() => {
    const reload = () => {
      try {
        setProfile(readLocalData().profile);
        setStorageError(null);
      } catch (error) {
        setStorageError(storageErrorMessage(error));
      } finally {
        setReady(true);
      }
      void queryClient.invalidateQueries();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_DATA_KEY || event.key === null) reload();
    };
    reload();
    window.addEventListener(LOCAL_DATA_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCAL_DATA_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient, revision]);
  const register = async (name: string) => {
    setProfile(saveLocalProfile(name));
  };
  const reset = async () => {
    resetLocalData();
    setProfile(null);
    queryClient.clear();
  };
  return (
    <AuthContext.Provider
      value={{
        ready,
        userId: profile?.id ?? null,
        name: profile?.name ?? null,
        storageError,
        retryStorage: () => setRevision((value) => value + 1),
        register,
        updateName: register,
        resetLocalData: reset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
