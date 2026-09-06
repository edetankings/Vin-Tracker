import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: InstallPromptEvent | null = null;

/** Removes any previously registered app service worker (no offline caching is used). */
export function cleanupServiceWorkers() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        const url = registration.active?.scriptURL ?? "";
        if (url.endsWith("/sw.js")) void registration.update();
      }
    })
    .catch(() => undefined);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useInstallApp() {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as InstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      deferredPrompt = null;
      setCanInstall(false);
      return "accepted" as const;
    }
    return "dismissed" as const;
  };

  return { canInstall, installed, install };
}
