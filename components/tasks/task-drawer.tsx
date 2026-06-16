"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./task-utils";
import type { Task, TaskStatus, TaskPriority } from "@/types/database";

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOLocal(local: string) {
  return new Date(local).toISOString();
}

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskDrawer({ task, onClose }: Props) {
  const update = useUpdateTask();
  const del = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("new");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState("");

  // Sync form when selected task changes (or its data is refetched)
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDeadline(task.deadline ? toLocalDatetime(task.deadline) : "");
  }, [task?.id, task?.updated_at]);

  if (!task) return null;

  async function handleSave() {
    if (!task) return;
    await update.mutateAsync({
      id: task.id,
      title: title.trim() || task.title,
      description: description || null,
      status,
      priority,
      deadline: deadline ? toISOLocal(deadline) : null,
    });
  }

  async function handleDone() {
    if (!task) return;
    await update.mutateAsync({ id: task.id, status: "done" });
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;
    await del.mutateAsync(task.id);
    onClose();
  }

  return (
    <div className="w-[300px] flex-shrink-0 bg-surface border-l border-border flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Название задачи"
            className="flex-1 text-base font-bold text-text-primary bg-transparent border-none outline-none resize-none leading-snug"
            placeholder="Название задачи"
          />
          <button onClick={onClose} aria-label="Закрыть" className="p-1 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Описание</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Добавить описание..."
            rows={3}
            className="w-full text-sm text-text-primary bg-muted/40 rounded-lg px-3 py-2 border border-transparent focus:border-primary outline-none resize-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Статус</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof STATUS_CONFIG[TaskStatus]][]).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Приоритет</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof PRIORITY_CONFIG[TaskPriority]][]).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>{cfg.icon} {cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Дедлайн</Label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1 border-green-200 text-green-600 hover:bg-green-50 mr-auto"
          onClick={handleDone}
          disabled={task.status === "done" || update.isPending}
        >
          ✓ Завершить
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-red-200 text-red-500 hover:bg-red-50"
          onClick={handleDelete}
          disabled={del.isPending}
        >
          Удалить
        </Button>
        <Button
          size="sm"
          className="text-xs"
          onClick={handleSave}
          disabled={update.isPending}
        >
          {update.isPending ? "..." : "Сохранить"}
        </Button>
      </div>
    </div>
  );
}
