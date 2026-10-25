import { APP_ICON } from "@/lib/app-meta";
import type { ReactNode } from "react";

import { BackgroundServices } from "@/components/BackgroundServices";
import { Onboarding } from "@/components/Onboarding";
import { useAuth } from "@/lib/auth";

export function AppGate({ children }: { children: ReactNode }) {
  const { ready, userId, name, storageError, retryStorage } = useAuth();

  if (!ready) {
    return (
      <div className="welcome-screen" role="status" aria-label="Loading Vin Tracker">
        <div className="welcome-layout !block">
          <div className="welcome-brand">
            <img src={APP_ICON} alt="" width={94} height={94} />
            <h1>Vin Tracker</h1>
            <p>Track your tasks. Build consistency.</p>
            <div className="mx-auto mt-10 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (storageError)
    return (
      <div className="welcome-screen">
        <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-7">
          <h1 className="text-xl font-bold">Unable to open your saved workspace</h1>
          <p role="alert" className="mt-4 text-sm leading-6 text-destructive">
            {storageError}
          </p>
          <button
            type="button"
            onClick={retryStorage}
            className="mt-6 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );

  if (!userId || !name) return <Onboarding />;

  return (
    <>
      <BackgroundServices />
      {children}
    </>
  );
}
