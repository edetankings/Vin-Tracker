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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? "flex h-8 w-12 items-center justify-center rounded-full bg-primary-soft transition-all"
                      : "flex h-8 w-12 items-center justify-center rounded-full transition-all"
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
