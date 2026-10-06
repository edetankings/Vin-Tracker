import { Link, useRouterState } from "@tanstack/react-router";
import { Settings, TrendingUp } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useInterfaceMotion } from "@/hooks/use-interface-motion";

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
  const container = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useInterfaceMotion(container, pathname);
  return (
    <div ref={container} className="interface-shell relative min-h-screen bg-background">
      <div className="relative z-10 mx-auto w-full max-w-md px-6 pt-7 pb-36 sm:max-w-lg lg:max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-foreground" aria-label="Vin Tracker home">
          <span className="brand-mark flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><TrendingUp className="h-4 w-4" /></span>
          Vin Tracker
        </Link>
        {title ? (
          <header data-enter className="mb-8 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[26px] leading-tight font-extrabold text-foreground">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[13px] font-medium text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action}
              <Button asChild variant="outline" size="icon" className="settings-control h-11 w-11 rounded-2xl bg-card text-muted-foreground shadow-card">
              <Link
                to="/settings"
                aria-label="Settings"
                activeProps={{ className: "text-primary" }}
              >
                <Settings className="h-[18px] w-[18px]" />
              </Link>
              </Button>
            </div>
          </header>
        ) : null}
        <div data-enter>{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
