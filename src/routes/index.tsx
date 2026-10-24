import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Flame, ListChecks, NotebookPen, Plus, ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskItem } from "@/components/TaskItem";
import { TaskSheet } from "@/components/TaskSheet";
import { Button } from "@/components/ui/button";
import { onAddTask } from "@/lib/add-task-bus";
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
  head: () => ({
    meta: [
      { title: "Today — Vin Tracker" },
      {
        name: "description",
        content:
          "Plan today’s tasks, capture your learning, and build consistency with Vin Tracker.",
      },
      { property: "og:title", content: "Today — Vin Tracker" },
      {
        property: "og:description",
        content:
          "Plan today’s tasks, capture your learning, and build consistency with Vin Tracker.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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

  useEffect(
    () =>
      onAddTask(() => {
        setEditing(null);
        setSheetOpen(true);
      }),
    [],
  );

  const today = new Date();
  const todays = tasksForDate(tasks, today);
  const percent = completionRate(todays);
  const done = todays.filter((task) => task.completed).length;
  const { current } = calculateStreaks(tasks, today);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title={`${greeting}, ${name}`} subtitle={format(today, "EEEE, d MMMM")}>
      <div className="home-overview">
        <div className="dashboard-summary">
          <section data-enter data-depth className="progress-surface">
            <div className="flex items-center gap-5 sm:gap-7">
              <div className="dimensional-ring relative flex shrink-0 items-center justify-center">
                <div className="[&_circle:first-child]:stroke-primary-foreground/25 [&_circle:last-child]:stroke-primary-foreground">
                  <ProgressRing percent={percent} size={80} stroke={6} />
                </div>
                <span className="absolute text-lg font-bold">{percent}%</span>
              </div>
              <div className="progress-copy min-w-0">
                <p className="text-sm/5 opacity-90">Today's progress</p>
                <p className="mt-1 font-display text-2xl font-bold">
                  {done} of {todays.length} done
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 text-xs font-medium">
                  <Flame className="h-3.5 w-3.5" />
                  {current} day streak
                </p>
              </div>
            </div>
          </section>
          <section className="dashboard-stats" aria-label="Your task statistics">
            <div className="dashboard-stat">
              <strong className="text-flame">
                {current}
                <span className="ml-1 text-base">🔥</span>
              </strong>
              <small>Day streak</small>
            </div>
            <div className="dashboard-stat">
              <strong className="text-primary">{todays.length - done}</strong>
              <small>Tasks left today</small>
            </div>
            <div className="dashboard-stat">
              <strong className="text-success">
                {tasks.filter((task) => task.completed).length}
              </strong>
              <small>Total completed</small>
            </div>
          </section>
        </div>

        <section data-enter className="home-tasks min-w-0">
          <div className="section-heading">
            <h2 className="text-lg font-bold">Today's tasks</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setSheetOpen(true);
              }}
            >
              <Plus size={14} /> Add task
            </Button>
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
        </section>

        <section data-enter className="home-learning min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Recent learning</h2>
            <Link to="/notes" className="text-xs font-medium text-primary">
              View all notes
            </Link>
          </div>
          {notes.length === 0 ? (
            <Link to="/notes" className="learning-note text-xs text-muted-foreground">
              <NotebookPen className="h-5 w-5 text-primary" />
              Capture what you learn — add your first note.
            </Link>
          ) : (
            <div className="space-y-2.5">
              {notes.slice(0, 3).map((note) => (
                <Link key={note.id} to="/notes" className="learning-note">
                  <span className="note-icon">
                    <NotebookPen size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{note.title}</p>
                    {note.content ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {note.content}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {format(parseISO(note.updated_at), "d MMM yyyy")}
                    </p>
                  </div>
                  <ArrowUpRight size={13} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <TaskSheet open={sheetOpen} onOpenChange={setSheetOpen} task={editing} />
    </AppShell>
  );
}
