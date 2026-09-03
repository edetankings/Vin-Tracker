import { createFileRoute } from "@tanstack/react-router";
import { Award, CheckCircle2, Flame, XCircle } from "lucide-react";

import { AppGate } from "@/components/AppGate";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuth } from "@/lib/auth";
import { progressSummary, useTasks, weeklyChartData } from "@/lib/tasks";

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
  const { data: tasks = [] } = useTasks(userId);
  const summary = progressSummary(tasks);
  const week = weeklyChartData(tasks);

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
    <AppShell title="Progress" subtitle="Your consistency at a glance">
      <section className="grid grid-cols-3 gap-3">
        {rings.map((ring) => (
          <div
            key={ring.label}
            className="flex flex-col items-center rounded-3xl border border-border bg-card p-3 shadow-card"
          >
            <div className="relative flex items-center justify-center">
              <ProgressRing percent={ring.value} size={68} stroke={7} />
              <span className="absolute text-sm font-bold">{ring.value}%</span>
            </div>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">{ring.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-semibold">This week</h2>
        <div className="mt-4 flex h-36 items-end justify-between gap-2">
          {week.map((day) => (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-lg bg-secondary">
                <div
                  className="w-full rounded-lg bg-primary transition-all duration-500"
                  style={{ height: `${Math.max(day.percent, day.total ? 6 : 0)}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{day.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-border bg-card p-4 shadow-card">
            <Icon className={`h-5 w-5 ${tone}`} />
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
