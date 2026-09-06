import { useEffect } from "react";

import { toDateKey, type Task } from "@/lib/tasks";

export const REMINDERS_KEY = "vin-reminders-enabled";
const FIRED_KEY = "vin-reminders-fired";
const DAILY_KEY = "vin-reminders-daily";

export function remindersEnabled() {
  try {
    return window.localStorage.getItem(REMINDERS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRemindersEnabled(value: boolean) {
  try {
    window.localStorage.setItem(REMINDERS_KEY, value ? "1" : "0");
  } catch {
    // storage unavailable
  }
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  const result = await Notification.requestPermission();
  return result as "granted" | "denied" | "default";
}

export async function showNotification(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/images/vin-icon.png", ...(tag ? { tag } : {}) });
  } catch {
    // notifications unavailable in this context
  }
}

function readFired(): string[] {
  try {
    const raw = window.localStorage.getItem(FIRED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markFired(id: string) {
  try {
    const next = [...new Set([...readFired(), id])].slice(-200);
    window.localStorage.setItem(FIRED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Fires reminders for timed tasks that are due, plus a daily plan nudge. */
export function useReminderScheduler(tasks: Task[]) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tick = () => {
      if (!remindersEnabled()) return;
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const todayKey = toDateKey(now);
      const fired = readFired();

      // Daily nudge at/after 08:00 when there are unfinished tasks.
      const pendingToday = tasks.filter((task) => task.date === todayKey && !task.completed);
      let lastDaily = "";
      try {
        lastDaily = window.localStorage.getItem(DAILY_KEY) ?? "";
      } catch {
        lastDaily = "";
      }
      if (now.getHours() >= 8 && pendingToday.length > 0 && lastDaily !== todayKey) {
        void showNotification(
          "Vin Tracker",
          `You have ${pendingToday.length} task${pendingToday.length > 1 ? "s" : ""} planned today.`,
          `daily-${todayKey}`,
        );
        try {
          window.localStorage.setItem(DAILY_KEY, todayKey);
        } catch {
          // ignore
        }
      }

      // Timed task reminders.
      for (const task of tasks) {
        if (task.completed || !task.time || task.date !== todayKey) continue;
        const id = `${task.id}-${task.date}-${task.time}`;
        if (fired.includes(id)) continue;
        const parts = task.time.split(":");
        const due = new Date(now);
        due.setHours(Number(parts[0] ?? 0), Number(parts[1] ?? 0), 0, 0);
        const diff = now.getTime() - due.getTime();
        if (diff >= 0 && diff < 60 * 60 * 1000) {
          void showNotification("Time for your task", task.title, id);
          markFired(id);
        }
      }
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tasks]);
}
