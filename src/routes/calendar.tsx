import { createFileRoute } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { AddTaskFab } from "@/components/AddTaskFab";
import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { TaskItem } from "@/components/TaskItem";
import { TaskSheet } from "@/components/TaskSheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { tasksForDate, toDateKey, useTaskMutations, useTasks, type Task } from "@/lib/tasks";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Vin Tracker" },
      { name: "description", content: "See your tasks day by day and plan the week ahead." },
      { property: "og:title", content: "Calendar — Vin Tracker" },
      { property: "og:description", content: "See your tasks day by day and plan the week ahead." },
    ],
  }),
  component: () => (
    <AppGate>
      <CalendarPage />
    </AppGate>
  ),
});

function CalendarPage() {
  const { userId } = useAuth();
  const { data: tasks = [] } = useTasks(userId);
  const { toggleTask, deleteTask } = useTaskMutations(userId);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  const counts = new Map<string, { total: number; done: number }>();
  for (const task of tasks) {
    const entry = counts.get(task.date) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.completed) entry.done += 1;
    counts.set(task.date, entry);
  }

  const dayTasks = tasksForDate(tasks, selected);

  return (
    <AppShell title="Calendar" subtitle="Plan your days">
      <section className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <header className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold">{format(month, "MMMM yyyy")}</p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
            <span key={`${label}-${i}`}>{label}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = toDateKey(day);
            const entry = counts.get(key);
            const isSelected = isSameDay(day, selected);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors",
                  !isSameMonth(day, month) && "text-muted-foreground/40",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-primary-soft text-primary"
                      : "hover:bg-secondary",
                )}
              >
                {format(day, "d")}
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                  {entry ? (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected
                          ? "bg-primary-foreground"
                          : entry.done === entry.total
                            ? "bg-success"
                            : "bg-warning",
                      )}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5 mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{format(selected, "EEEE, d MMM")}</h2>
        {dayTasks.length > 0 ? (
          <span className="text-xs font-medium text-muted-foreground">
            {dayTasks.filter((t) => t.completed).length}/{dayTasks.length} completed
          </span>
        ) : null}
      </div>

      {dayTasks.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No tasks this day"
          description="Tap the plus button to schedule something."
        />
      ) : (
        <div className="space-y-2.5">
          {dayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={(t) => toggleTask.mutate(t)}
              onEdit={(t) => {
                setEditing(t);
                setSheetOpen(true);
              }}
              onDelete={(t) => deleteTask.mutate(t.id)}
            />
          ))}
        </div>
      )}

      <AddTaskFab
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      />
      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editing}
        defaultDate={selected}
      />
    </AppShell>
  );
}
