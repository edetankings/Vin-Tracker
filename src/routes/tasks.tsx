import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { ListChecks, Plus, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { TaskItem } from "@/components/TaskItem";
import { TaskSheet } from "@/components/TaskSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onAddTask } from "@/lib/add-task-bus";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  fromDateKey,
  toDateKey,
  useCategories,
  useTaskMutations,
  useTasks,
  type Task,
} from "@/lib/tasks";

type Filter = "all" | "today" | "upcoming" | "completed";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "All Tasks — Vin Tracker" },
      {
        name: "description",
        content: "Search and filter every task you've planned in Vin Tracker.",
      },
      { property: "og:title", content: "All Tasks — Vin Tracker" },
      {
        property: "og:description",
        content: "Search and filter every task you've planned in Vin Tracker.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <TasksPage />
    </AppGate>
  ),
});

function TasksPage() {
  const { userId } = useAuth();
  const { data: tasks = [] } = useTasks(userId);
  const { data: categories = [] } = useCategories(userId);
  const { toggleTask, deleteTask } = useTaskMutations(userId);

  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(
    () =>
      onAddTask(() => {
        setEditing(null);
        setSheetOpen(true);
      }),
    [],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayKey = toDateKey(new Date());
    return tasks.filter((task) => {
      if (filter === "today" && task.date !== todayKey) return false;
      if (filter === "upcoming" && (task.date <= todayKey || task.completed)) return false;
      if (filter === "completed" && !task.completed) return false;
      if (category && task.category !== category) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, filter, category, search]);

  return (
    <AppShell title="My Tasks" subtitle="Stay focused on what matters.">
      <div className="page-toolbar">
        <div className="search-field">
          <Search />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks"
            className="rounded-2xl"
            aria-label="Search tasks"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
        >
          <Plus size={15} /> Add task
        </Button>
      </div>

      <div className="filter-tabs" aria-label="Filter tasks">
        {(["all", "today", "upcoming", "completed"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold capitalize transition-colors",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            category === null
              ? "border-primary bg-primary-soft text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          All categories
        </button>
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === name
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="task-results">
        <p className="task-result-count">
          {visible.length} {visible.length === 1 ? "task" : "tasks"}
          {filter !== "all" ? ` · ${filter}` : ""}
        </p>
        <div className={visible.length ? "task-table" : ""}>
          {visible.length > 0 ? (
            <div className="task-table-heading" aria-hidden="true">
              <span>Task</span>
              <span>Date</span>
              <span>Time</span>
              <span>Priority</span>
              <span>Category</span>
              <span>Status</span>
              <span />
            </div>
          ) : null}
          {visible.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="No tasks found"
              description="Try a different filter, or add a new task to get going."
            />
          ) : (
            visible.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showDate={format(fromDateKey(task.date), "d MMM")}
                onToggle={(t) => toggleTask.mutate(t)}
                onEdit={(t) => {
                  setEditing(t);
                  setSheetOpen(true);
                }}
                onDelete={(t) => deleteTask.mutate(t.id)}
              />
            ))
          )}
        </div>
      </div>
      <TaskSheet open={sheetOpen} onOpenChange={setSheetOpen} task={editing} />
    </AppShell>
  );
}
