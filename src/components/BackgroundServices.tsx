import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { registerServiceWorker } from "@/lib/pwa";
import { useReminderScheduler } from "@/lib/reminders";
import { useTasks } from "@/lib/tasks";

/** Registers offline support and keeps task reminders running while the app is open. */
export function BackgroundServices() {
  const { userId } = useAuth();
  const { data: tasks = [] } = useTasks(userId);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useReminderScheduler(tasks);

  return null;
}
