import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { cleanupServiceWorkers } from "@/lib/pwa";
import { useReminderScheduler } from "@/lib/reminders";
import { useTasks } from "@/lib/tasks";

/** Keeps task reminders running while the app is open. */
export function BackgroundServices() {
  const { userId } = useAuth();
  const { data: tasks = [] } = useTasks(userId);

  useEffect(() => {
    cleanupServiceWorkers();
  }, []);

  useReminderScheduler(tasks);

  return null;
}
