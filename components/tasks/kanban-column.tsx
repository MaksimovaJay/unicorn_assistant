"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDeadline } from "./task-utils";
import type { Task, TaskStatus } from "@/types/database";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (task: Task | null) => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanColumn({ status, tasks, selectedTaskId, onSelectTask, onDrop }: Props) {
  const cfg = STATUS_CONFIG[status];
  const create = useCreateTask();
  const update = useUpdateTask();
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function handleAddTask() {
    if (!addTitle.trim()) return;
    create.mutate({ title: addTitle.trim(), status });
    setAddTitle("");
    setAddOpen(false);
  }

  function handleCheckbox(task: Task, e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus: TaskStatus = task.status === "done" ? "new" : "done";
    update.mutate({ id: task.id, status: newStatus });
    if (selectedTaskId === task.id) onSelectTask(null);
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border transition-colors min-h-[400px]",
        dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) onDrop(taskId, status);
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-black text-text-secondary uppercase tracking-wider">
          {cfg.label}
        </span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cfg.className)}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {tasks.map((task) => {
          const priority = PRIORITY_CONFIG[task.priority];
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
              onClick={() => onSelectTask(selectedTaskId === task.id ? null : task)}
              className={cn(
                "bg-surface border rounded-xl p-3 cursor-pointer transition-all",
                selectedTaskId === task.id
                  ? "border-primary shadow-sm"
                  : "border-border hover:border-primary/50 hover:shadow-sm"
              )}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={(e) => handleCheckbox(task, e)}
                  className={cn(
                    "mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                    task.status === "done" ? "bg-primary border-primary" : "border-border hover:border-primary"
                  )}
                >
                  {task.status === "done" && <span className="text-white text-[9px]">✓</span>}
                </button>
                <p className={cn(
                  "text-sm font-semibold text-text-primary leading-snug",
                  task.status === "done" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {task.deadline && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-text-secondary">
                    📅 {formatDeadline(task.deadline)}
                  </span>
                )}
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", priority.className)}>
                  {priority.icon} {priority.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Quick add */}
        {addOpen ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") setAddOpen(false);
              }}
              placeholder="Название задачи"
              className="w-full text-sm bg-surface border border-primary rounded-lg px-3 py-2 outline-none"
            />
            <div className="flex gap-1.5">
              <button onClick={handleAddTask} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold">
                Добавить
              </button>
              <button onClick={() => setAddOpen(false)} className="text-xs text-muted-foreground px-2 py-1.5">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary w-full py-2 transition-colors"
          >
            <Plus size={12} /> Добавить задачу
          </button>
        )}
      </div>
    </div>
  );
}
