import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import { Award, CheckCircle2, Flame, XCircle } from "lucide-react";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuth } from "@/lib/auth";
import {
  completionRate,
  progressSummary,
  tasksForDate,
  toDateKey,
  useTasks,
  weeklyChartData,
} from "@/lib/tasks";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Vin Tracker" },
      { name: "description", content: "Track completion rates, streaks and weekly consistency." },
      { property: "og:title", content: "Progress — Vin Tracker" },
      {
        property: "og:description",
        content: "Track completion rates, streaks and weekly consistency.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <ProgressPage />
    </AppGate>
  ),
});

function ProgressPage() {
  const { userId } = useAuth();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const { data: tasks = [] } = useTasks(userId);
  const summary = progressSummary(tasks);
  const week = weeklyChartData(tasks);
  const today = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const chart =
    period === "day"
      ? [{ day: "Today", percent: summary.today, total: tasksForDate(tasks, today).length }]
      : period === "month"
        ? monthDays.map((day) => {
            const dayTasks = tasksForDate(tasks, day);
            return {
              day: format(day, "d"),
              percent: completionRate(dayTasks),
              total: dayTasks.length,
            };
          })
        : week;

  const rings = [
    { label: "Today", value: summary.today },
    { label: "This week", value: summary.week },
    { label: "This month", value: summary.month },
  ];

  const stats = [
    { label: "Completed", value: summary.completed, icon: CheckCircle2, tone: "text-success" },
    { label: "Missed", value: summary.missed, icon: XCircle, tone: "text-destructive" },
    { label: "Current streak", value: summary.currentStreak, icon: Flame, tone: "text-warning" },
    { label: "Best streak", value: summary.bestStreak, icon: Award, tone: "text-primary" },
  ];

  return (
    <AppShell title="Progress" subtitle="Your consistency journey.">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{format(today, "MMMM yyyy")}</p>
        <div className="filter-tabs" aria-label="Progress period">
          {(["day", "week", "month"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
              className="capitalize"
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="progress-layout">
        <section className="progress-rings" aria-label="Completion rates">
          {rings.map((ring) => (
            <div key={ring.label} className="progress-ring-card">
              <div className="relative flex items-center justify-center">
                <ProgressRing percent={ring.value} size={76} stroke={6} />
                <span className="absolute text-base font-extrabold">{ring.value}%</span>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">{ring.label}</p>
            </div>
          ))}
        </section>
        <section className="progress-stats" aria-label="Lifetime statistics">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="progress-stat">
              <Icon className={`h-5 w-5 ${tone}`} />
              <strong>
                {value}
                {label.includes("streak") ? (
                  <span className="ml-1 text-xs font-medium">{value === 1 ? "day" : "days"}</span>
                ) : null}
              </strong>
              <p>{label}</p>
            </div>
          ))}
        </section>
        <section className="progress-chart panel">
          <div className="section-heading">
            <h2>
              {period === "day"
                ? "Today's progress"
                : period === "month"
                  ? "Monthly progress"
                  : "Weekly progress"}
            </h2>
            <span className="text-[10px] text-muted-foreground">Completion rate</span>
          </div>
          <div
            className="flex h-52 items-end gap-2"
            role="img"
            aria-label={chart
              .map((day) => `${day.day}: ${day.percent}% of ${day.total} tasks`)
              .join(", ")}
          >
            {chart.map((day) => (
              <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                <span
                  className={
                    period === "month"
                      ? "sr-only"
                      : "text-[10px] font-semibold text-muted-foreground"
                  }
                >
                  {day.percent}%
                </span>
                <div className="flex h-36 w-full items-end rounded-t bg-secondary">
                  <div
                    className="w-full rounded-t bg-primary transition-[height] duration-500"
                    style={{ height: `${day.percent}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {period !== "month" || Number(day.day) % 5 === 1 ? day.day : "·"}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="progress-chart panel">
          <div className="section-heading">
            <h2>Monthly overview</h2>
            <span className="text-[10px] text-muted-foreground">{format(today, "MMM yyyy")}</span>
          </div>
          <div className="grid grid-cols-7 text-center text-[9px] text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="month-activity">
            {Array.from({ length: (startOfMonth(today).getDay() + 6) % 7 }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {monthDays.map((day) => {
              const dayTasks = tasksForDate(tasks, day);
              const percent = completionRate(dayTasks);
              return (
                <span
                  key={toDateKey(day)}
                  className={`activity-day ${dayTasks.length ? "has-tasks" : ""} ${percent === 100 ? "is-complete" : ""}`}
                  title={`${format(day, "MMMM d")}: ${percent}% complete, ${dayTasks.length} tasks`}
                  aria-label={`${format(day, "MMMM d")}: ${percent}% complete`}
                >
                  {format(day, "d")}
                </span>
              );
            })}
          </div>
          <p className="mt-5 text-[10px] leading-5 text-muted-foreground">
            Every completed task is a step forward. Blue days are fully completed.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
