import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { storageErrorMessage } from "@/lib/local-store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toDateKey, useCategories, useTaskMutations, type Priority, type Task } from "@/lib/tasks";

const priorities: Priority[] = ["low", "medium", "high"];

export function TaskSheet({
  open,
  onOpenChange,
  defaultDate,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  task?: Task | null;
}) {
  const { userId } = useAuth();
  const { createTask, updateTask, addCategory } = useTaskMutations(userId);
  const { data: categories = [] } = useCategories(userId);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateKey(defaultDate ?? new Date()));
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDate(task?.date ?? toDateKey(defaultDate ?? new Date()));
    setTime(task?.time ? task.time.slice(0, 5) : "");
    setPriority(task?.priority ?? "medium");
    setCategory(task?.category ?? null);
    setNewCategory("");
    setShowNewCategory(false);
  }, [open, task, defaultDate]);

  const saving = createTask.isPending || updateTask.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Give your task a name");
      return;
    }
    const payload = {
      title: title.trim(),
      date,
      time: time ? `${time}:00` : null,
      priority,
      category,
    };
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, changes: payload });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Task added");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(storageErrorMessage(error));
    }
  };

  const saveCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await addCategory.mutateAsync(name);
      setCategory(name);
      setNewCategory("");
      setShowNewCategory(false);
    } catch (error) {
      toast.error(storageErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="responsive-sheet border-border px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]"
      >
        <SheetHeader className="px-0">
          <SheetTitle className="text-xl">{task ? "Edit task" : "Add Task"}</SheetTitle>
          <SheetDescription className="sr-only">
            Plan your task, date, time, priority and category.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Study Python"
              autoComplete="off"
              enterKeyHint="done"
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 rounded-2xl text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-time">Time (optional)</Label>
              <Input
                id="task-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="h-12 rounded-2xl text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPriority(option)}
                  className={cn(
                    "h-11 rounded-2xl border text-sm font-semibold capitalize transition-colors",
                    priority === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(category === name ? null : name)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    category === name
                      ? "border-primary bg-primary-soft text-accent-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewCategory((value) => !value)}
                className="flex items-center gap-1 rounded-full border border-dashed border-border px-3.5 py-2 text-sm font-medium text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            </div>
            {showNewCategory ? (
              <div className="flex gap-2 pt-1">
                <Input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Category name"
                  className="h-11 rounded-2xl"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 rounded-2xl"
                  onClick={saveCategory}
                >
                  Save
                </Button>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            {task ? "Save changes" : "Add Task"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
