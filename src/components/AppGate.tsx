import type { ReactNode } from "react";

import { Onboarding } from "@/components/Onboarding";
import { useAuth } from "@/lib/auth";

export function AppGate({ children }: { children: ReactNode }) {
  const { ready, userId, name } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!userId || !name) return <Onboarding />;

  return <>{children}</>;
}
