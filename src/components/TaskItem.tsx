import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatTime, fromDateKey, type Task } from "@/lib/tasks";

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
    <div className="task-surface">
      <div className="task-name-cell flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
          onClick={() => {
            setPop(true);
            window.setTimeout(() => setPop(false), 320);
            onToggle(task);
          }}
          className={cn(
            "task-check h-5 w-5 p-0",
            task.completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent text-transparent",
            pop && "animate-pop",
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </Button>

        <div className="min-w-0 flex-1">
          <p className={cn("task-title", task.completed && "text-muted-foreground line-through")}>
            {task.title}
          </p>
          <div className="task-meta">
            {time ? <span>{time}</span> : <span>No time set</span>}
            {showDate ? <span>{showDate}</span> : null}
            {task.category ? <span>{task.category}</span> : null}
          </div>
        </div>
      </div>
      <span className={`priority-badge task-mobile-priority priority-${task.priority}`}>
        {task.priority}
      </span>
      <span className="task-desktop-cell">{format(fromDateKey(task.date), "MMM d, yyyy")}</span>
      <span className="task-desktop-cell">{time || "—"}</span>
      <span className="task-desktop-cell">
        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
      </span>
      <span className="task-desktop-cell">{task.category || "—"}</span>
      <span className="task-desktop-cell" aria-label={task.completed ? "Completed" : "Pending"}>
        <span className={`task-status inline-block ${task.completed ? "complete" : ""}`} />
      </span>

      {onEdit || onDelete ? (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Task options" className="task-options">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit ? (
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            ) : null}
            {onDelete ? (
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
