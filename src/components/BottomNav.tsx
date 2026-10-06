import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, Home, ListChecks, NotebookPen, Plus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useInterfaceMotion } from "@/hooks/use-interface-motion";

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
      data-tactile
      activeProps={{ className: "text-primary" }}
    >
      {({ isActive }) => (
        <>
          <span
            className={
              isActive
                 ? "nav-active flex h-8 w-full max-w-[46px] items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all"
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
  const nav = useRef<HTMLElement>(null);
  useInterfaceMotion(nav);
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
    <nav ref={nav} aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
      <div data-enter className="navigation-dock glass mx-auto flex max-w-md items-stretch justify-between rounded-[28px] border border-border/70 px-1.5 py-2">
        {left.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}

        <div className="flex flex-1 items-center justify-center">
          <Button
            type="button"
            onClick={addTask}
            aria-label="Add task"
            title="Add task"
            size="icon"
            className="add-task-control -mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground [&_svg]:size-6"
          >
            <Plus className="h-6 w-6" strokeWidth={2.6} />
          </Button>
        </div>

        {right.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
