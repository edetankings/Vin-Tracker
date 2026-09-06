import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
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
    <div className="relative min-h-screen bg-background">
      <div className="app-aurora" aria-hidden="true">
        <div className="animate-float absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/25 blur-[90px]" />
        <div className="animate-float absolute -top-20 -right-28 h-64 w-64 rounded-full bg-chart-5/20 blur-[90px] [animation-delay:-5s]" />
        <div className="animate-float absolute top-1/3 -right-20 h-56 w-56 rounded-full bg-chart-4/15 blur-[90px] [animation-delay:-9s]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pt-8 pb-36 sm:max-w-lg lg:max-w-2xl">
        {title ? (
          <header className="animate-rise mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="gradient-text text-[26px] leading-tight font-extrabold tracking-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[13px] font-medium text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action}
              <Link
                to="/settings"
                aria-label="Settings"
                className="press glass flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 text-muted-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <Settings className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </header>
        ) : null}
        <div className="animate-rise [animation-delay:60ms]">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
