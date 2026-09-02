import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO, startOfMonth, startOfWeek } from "date-fns";

import { supabase } from "@/integrations/supabase/client";

export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string | null;
  priority: Priority;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  date: string;
  time: string | null;
  priority: Priority;
  category: string | null;
};

export const DEFAULT_CATEGORIES = ["Study", "Work", "Personal", "Exercise", "Project"];

export const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");
export const fromDateKey = (key: string) => parseISO(key);

export const formatTime = (time: string | null) => {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
};

export function useTasks(userId: string | null) {
  return useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useCategories(userId: string | null) {
  return useQuery({
    queryKey: ["categories", userId],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const custom = (data ?? []).map((row) => row.name as string);
      return Array.from(new Set([...DEFAULT_CATEGORIES, ...custom]));
    },
  });
}

export function useTaskMutations(userId: string | null) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
  };

  const createTask = useMutation({
    mutationFn: async (input: TaskInput) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("tasks").insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<TaskInput> }) => {
      const { error } = await supabase.from("tasks").update(changes).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleTask = useMutation({
    mutationFn: async (task: Task) => {
      const next = !task.completed;
      const { error } = await supabase
        .from("tasks")
        .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAllTasks = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("tasks").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("categories").insert({ name, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });

  return { createTask, updateTask, toggleTask, deleteTask, deleteAllTasks, addCategory };
}

export const tasksForDate = (tasks: Task[], date: Date) =>
  tasks.filter((task) => task.date === toDateKey(date));

export function completionRate(tasks: Task[]) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => task.completed).length;
  return Math.round((done / tasks.length) * 100);
}

/** Dates (yyyy-MM-dd) on which at least one task was completed. */
export function completedDays(tasks: Task[]) {
  return new Set(tasks.filter((task) => task.completed).map((task) => task.date));
}

export function calculateStreaks(tasks: Task[], today = new Date()) {
  const days = completedDays(tasks);
  if (days.size === 0) return { current: 0, best: 0 };

  const sorted = Array.from(days).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = fromDateKey(sorted[i - 1]);
    const expected = toDateKey(addDays(prev, 1));
    run = sorted[i] === expected ? run + 1 : 1;
    if (run > best) best = run;
  }

  let current = 0;
  let cursor = new Date(today);
  if (!days.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(toDateKey(cursor))) return { current: 0, best };
  }
  while (days.has(toDateKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

export function progressSummary(tasks: Task[], today = new Date()) {
  const todayKey = toDateKey(today);
  const weekStart = toDateKey(startOfWeek(today, { weekStartsOn: 1 }));
  const monthStart = toDateKey(startOfMonth(today));

  const todayTasks = tasks.filter((task) => task.date === todayKey);
  const weekTasks = tasks.filter((task) => task.date >= weekStart && task.date <= todayKey);
  const monthTasks = tasks.filter((task) => task.date >= monthStart && task.date <= todayKey);

  const completed = tasks.filter((task) => task.completed).length;
  const missed = tasks.filter((task) => !task.completed && task.date < todayKey).length;
  const { current, best } = calculateStreaks(tasks, today);

  return {
    today: completionRate(todayTasks),
    week: completionRate(weekTasks),
    month: completionRate(monthTasks),
    completed,
    missed,
    currentStreak: current,
    bestStreak: best,
  };
}

export function weeklyChartData(tasks: Task[], today = new Date()) {
  const start = startOfWeek(today, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index);
    const key = toDateKey(day);
    const dayTasks = tasks.filter((task) => task.date === key);
    return {
      day: format(day, "EEE"),
      percent: completionRate(dayTasks),
      total: dayTasks.length,
    };
  });
}
