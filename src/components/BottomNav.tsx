import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Home, ListChecks, NotebookPen, Plus } from "lucide-react";

import { emitAddTask } from "@/lib/add-task-bus";

const left = [
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
] as const;

const right = [
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

const linkClass =
  "press flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[10px] font-semibold text-muted-foreground active:scale-95";

function NavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className={linkClass}
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
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const addTask = () => {
    if (pathname === "/" || pathname === "/calendar" || pathname === "/tasks") {
      emitAddTask();
      return;
    }
    void navigate({ to: "/" }).then(() => {
      setTimeout(emitAddTask, 120);
    });
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
      <div className="glass mx-auto flex max-w-md items-stretch justify-between rounded-[26px] border border-border/70 px-1.5 py-1.5 shadow-[0_16px_40px_-16px_oklch(0.3_0.09_265/0.4)]">
        {left.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}

        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={addTask}
            aria-label="Add task"
            className="hero-gradient press -mt-6 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-[0_12px_26px_-10px_oklch(0.45_0.19_265/0.9)] transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </button>
        </div>

        {right.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
