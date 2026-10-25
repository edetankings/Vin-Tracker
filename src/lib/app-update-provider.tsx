import { UpdateContext, type UpdateStatus } from "@/lib/app-update-state";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { APP_BUILD_ID } from "@/lib/app-meta";
import {
  fetchAppRelease,
  isNewAppBuild,
  updateReloadUrl,
  UPDATE_POLL_MS,
  type AppRelease,
} from "@/lib/app-updates";

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [latest, setLatest] = useState<AppRelease | null>(null);
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [dismissedBuildId, setDismissedBuildId] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const applying = useRef(false);

  const checkForUpdates = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const controller = new AbortController();
    const current = ++generation.current;
    request.current = controller;
    setStatus("checking");
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    const promise = (async () => {
      try {
        const release = await fetchAppRelease(fetch, controller.signal);
        if (current !== generation.current) return;
        const available = isNewAppBuild(APP_BUILD_ID, release);
        setLatest(available ? release : null);
        setStatus(available ? "available" : "current");
        setError(null);
      } catch {
        if (current !== generation.current) return;
        setStatus("error");
        setError("Unable to check for updates. Try again when connected.");
      } finally {
        window.clearTimeout(timeout);
        if (current === generation.current) {
          request.current = null;
          inFlight.current = null;
        }
      }
    })();
    inFlight.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    void checkForUpdates();
    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdates();
    };
    const interval = window.setInterval(checkWhenVisible, UPDATE_POLL_MS);
    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("online", checkWhenVisible);
    window.addEventListener("focus", checkWhenVisible);
    return () => {
      generation.current += 1;
      request.current?.abort();
      request.current = null;
      inFlight.current = null;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("online", checkWhenVisible);
      window.removeEventListener("focus", checkWhenVisible);
    };
  }, [checkForUpdates]);

  const applyUpdate = async () => {
    if (!latest || applying.current) return;
    applying.current = true;
    setUpdating(true);
    setError(null);
    try {
      // Recheck connectivity and the active release before navigating away.
      const release = await fetchAppRelease(fetch, AbortSignal.timeout(10_000));
      if (!isNewAppBuild(APP_BUILD_ID, release)) {
        setLatest(null);
        setStatus("current");
        setUpdating(false);
        applying.current = false;
        return;
      }
      window.location.replace(updateReloadUrl(window.location.href, release));
    } catch {
      setError(
        "The update could not be loaded. Your saved data is unchanged. Reconnect and try again.",
      );
      setUpdating(false);
      applying.current = false;
    }
  };

  return (
    <UpdateContext.Provider
      value={{
        latest,
        status,
        error,
        updating,
        dismissed: !!latest && dismissedBuildId === latest.buildId,
        checkForUpdates,
        applyUpdate,
        dismissUpdate: () => setDismissedBuildId(latest?.buildId ?? null),
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}
