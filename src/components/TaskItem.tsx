import { Check, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatTime, type Task } from "@/lib/tasks";

const priorityStyles: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning-soft text-warning",
  high: "bg-primary-soft text-accent-foreground",
};

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  showDate,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  showDate?: string;
}) {
  const [pop, setPop] = useState(false);
  const time = formatTime(task.time);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-card">
      <button
        type="button"
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        onClick={() => {
          setPop(true);
          window.setTimeout(() => setPop(false), 320);
          onToggle(task);
        }}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.completed
            ? "border-success bg-success text-success-foreground"
            : "border-border bg-transparent text-transparent",
          pop && "animate-pop",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[15px] font-semibold leading-tight",
            task.completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {time ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          ) : null}
          {showDate ? <span>{showDate}</span> : null}
          {task.category ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {task.category}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium capitalize",
              priorityStyles[task.priority],
            )}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Task options"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
