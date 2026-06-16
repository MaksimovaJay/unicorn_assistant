"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_CONFIG } from "./task-utils";
import type { TaskPriority } from "@/types/database";

function toISOLocal(local: string) {
  return new Date(local).toISOString();
}

interface Props {
  onAdd: (data: { title: string; deadline: string | null; priority: TaskPriority }) => void;
  isLoading?: boolean;
}

export function TaskQuickAdd({ onAdd, isLoading }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");

  function handleSubmit() {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), deadline: deadline ? toISOLocal(deadline) : null, priority });
    setTitle("");
    setDeadline("");
    setPriority("medium");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2.5 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus size={14} /> Быстро добавить задачу...
      </button>
    );
  }

  return (
    <div className="border border-primary/40 rounded-xl p-3 bg-surface shadow-sm space-y-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Название задачи"
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-8 text-xs flex-1"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
          <SelectTrigger className="h-8 text-xs w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof PRIORITY_CONFIG[TaskPriority]][]).map(([val, cfg]) => (
              <SelectItem key={val} value={val}>{cfg.icon} {cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>Отмена</Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit} disabled={!title.trim() || isLoading}>
          Добавить
        </Button>
      </div>
    </div>
  );
}
