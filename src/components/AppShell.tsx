import type { ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-32 sm:max-w-lg lg:max-w-2xl">
        {title ? (
          <header className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {action}
          </header>
        ) : null}
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
