import { Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Home, ListChecks, NotebookPen, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
      <div className="glass mx-auto flex max-w-md items-stretch justify-between rounded-[26px] border border-border/70 px-1.5 py-1.5 shadow-[0_16px_40px_-16px_oklch(0.3_0.09_265/0.4)]">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="press flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-semibold text-muted-foreground active:scale-95"
            activeProps={{ className: "text-primary" }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? "hero-gradient flex h-8 w-full max-w-[46px] items-center justify-center rounded-2xl text-primary-foreground shadow-[0_8px_18px_-8px_oklch(0.45_0.19_265/0.8)] transition-all"
                      : "flex h-8 w-full max-w-[46px] items-center justify-center rounded-2xl transition-all"
                  }
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                {label}
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
