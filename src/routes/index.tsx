import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Flame, ListChecks, NotebookPen } from "lucide-react";
import { useState } from "react";

import { AddTaskFab } from "@/components/AddTaskFab";
import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskItem } from "@/components/TaskItem";
import { TaskSheet } from "@/components/TaskSheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNotes } from "@/lib/notes";
import {
  calculateStreaks,
  completionRate,
  tasksForDate,
  useTaskMutations,
  useTasks,
  type Task,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  component: () => (
    <AppGate>
      <HomePage />
    </AppGate>
  ),
});

function HomePage() {
  const { userId, name } = useAuth();
  const { data: tasks = [] } = useTasks(userId);
  const { data: notes = [] } = useNotes(userId);
  const { toggleTask, deleteTask } = useTaskMutations(userId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const today = new Date();
  const todays = tasksForDate(tasks, today);
  const percent = completionRate(todays);
  const done = todays.filter((task) => task.completed).length;
  const { current } = calculateStreaks(tasks, today);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title={`${greeting}, ${name}`} subtitle={format(today, "EEEE, d MMMM")}>
      <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            <div className="[&_circle:first-child]:stroke-primary-foreground/25 [&_circle:last-child]:stroke-primary-foreground">
              <ProgressRing percent={percent} />
            </div>
            <span className="absolute text-lg font-bold">{percent}%</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm/5 opacity-90">Today's progress</p>
            <p className="mt-1 text-2xl font-bold">
              {done} of {todays.length} done
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium opacity-90">
              <Flame className="h-3.5 w-3.5" />
              {current} day streak
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Today's tasks</h2>
        <span className="text-xs text-muted-foreground">{todays.length} total</span>
      </div>

      {todays.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No tasks planned"
          description="Plan something and start making progress."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              Add a task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {todays.map((task) => (
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

      {todays.length > 0 && done === todays.length ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success-soft p-3.5 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" /> All done for today. Great work!
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recently Learned</h2>
          <Link to="/notes" className="text-xs font-medium text-primary">
            View All Notes
          </Link>
        </div>
        {notes.length === 0 ? (
          <Link
            to="/notes"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground"
          >
            <NotebookPen className="h-5 w-5 text-primary" />
            Capture what you learn — add your first note.
          </Link>
        ) : (
          <div className="space-y-2.5">
            {notes.slice(0, 3).map((note) => (
              <Link
                key={note.id}
                to="/notes"
                className="block rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <p className="truncate text-sm font-semibold">{note.title}</p>
                {note.content ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
                ) : null}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {format(parseISO(note.updated_at), "d MMM yyyy")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <AddTaskFab
        onClick={() => {
          setEditing(null);
          setSheetOpen(true);
        }}
      />
      <TaskSheet open={sheetOpen} onOpenChange={setSheetOpen} task={editing} />
    </AppShell>
  );
}
