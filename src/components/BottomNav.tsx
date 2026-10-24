import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { emitAddTask } from "@/lib/add-task-bus";

export function BottomNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const supportsTasks = ["/", "/calendar", "/tasks"].includes(pathname);
  const addTask = () => {
    if (supportsTasks) emitAddTask();
    else void navigate({ to: "/tasks" }).then(() => setTimeout(emitAddTask, 120));
  };
  return (
    <>
      {supportsTasks ? (
        <button type="button" onClick={addTask} className="mobile-add-task" aria-label="Add task">
          <Plus size={25} />
        </button>
      ) : null}
      <nav aria-label="Mobile navigation" className="mobile-navigation">
        {navigationItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ className: "is-active" }}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
