import type { ReactNode } from "react";

import { BackgroundServices } from "@/components/BackgroundServices";
import { Onboarding } from "@/components/Onboarding";
import { useAuth } from "@/lib/auth";

export function AppGate({ children }: { children: ReactNode }) {
  const { ready, userId, name } = useAuth();

  if (!ready) {
    return (
      <div className="welcome-screen" role="status" aria-label="Loading Vin Tracker">
        <div className="welcome-layout !block">
          <div className="welcome-brand">
            <img src="/images/vin-icon.png" alt="" width={94} height={94} />
            <h1>Vin Tracker</h1>
            <p>Track your tasks. Build consistency.</p>
            <div className="mx-auto mt-10 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!userId || !name) return <Onboarding />;

  return (
    <>
      <BackgroundServices />
      {children}
    </>
  );
}
