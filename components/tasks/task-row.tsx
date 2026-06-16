"use client";

import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDeadline, isOverdue, isToday } from "./task-utils";
import type { Task } from "@/types/database";

interface Props {
  task: Task;
  isActive: boolean;
  onSelect: () => void;
  onToggleDone: () => void;
}

export function TaskRow({ task, isActive, onSelect, onToggleDone }: Props) {
  const isDone = task.status === "done";
  const overdue = isOverdue(task.deadline, task.status);
  const today = isToday(task.deadline);
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-3 bg-surface border rounded-xl px-3 py-2.5 cursor-pointer transition-all",
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
        className={cn(
          "mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex-shrink-0 flex items-center justify-center transition-colors",
          isDone ? "bg-primary border-primary" : "border-border hover:border-primary"
        )}
      >
        {isDone && <span className="text-white text-[10px] font-black">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold text-text-primary truncate",
          isDone && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {task.deadline && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
              overdue ? "bg-red-100 text-red-600" :
              today   ? "bg-amber-100 text-amber-600" :
                        "bg-muted text-text-secondary"
            )}>
              📅 {formatDeadline(task.deadline)}
            </span>
          )}
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            priority.className
          )}>
            {priority.icon} {priority.label}
          </span>
          {task.status !== "new" && !isDone && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              STATUS_CONFIG[task.status].className
            )}>
              {STATUS_CONFIG[task.status].label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
