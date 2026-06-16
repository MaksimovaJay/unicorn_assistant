# Tasks Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured Tasks section with list view (filter tabs + grouped rows + drawer) and kanban view, replacing the current "Coming Soon" placeholder at `/tasks`.

**Architecture:** API routes handle CRUD scoped to `workspace_id` via profile lookup. React Query hooks manage server state. Page shell owns the selected task + view mode (list/kanban), passing state down to `TasksList` or `TasksKanban`; the `TaskDrawer` is rendered at the page level and shared between both views.

**Tech Stack:** Next.js App Router, Supabase (server client via cookies), TanStack Query, Tailwind CSS, existing Shadcn UI components (`Select`, `Dialog`, `Input`, `Button`).

---

## File Map

**Create:**
- `app/api/tasks/route.ts` — GET list + POST create
- `app/api/tasks/[id]/route.ts` — PATCH update + DELETE
- `hooks/use-tasks.ts` — all React Query hooks
- `components/tasks/task-utils.ts` — priority/status config, date grouping helpers
- `components/tasks/task-row.tsx` — single row in list view
- `components/tasks/task-drawer.tsx` — right-side detail/edit panel
- `components/tasks/task-quick-add.tsx` — inline quick-add form
- `components/tasks/tasks-list.tsx` — list view: tabs, groups, rows
- `components/tasks/kanban-column.tsx` — single kanban column
- `components/tasks/tasks-kanban.tsx` — three-column kanban board

**Modify:**
- `app/(workspace)/tasks/page.tsx` — replace ComingSoon with page shell

---

## Task 1: API Routes

**Files:**
- Create: `app/api/tasks/route.ts`
- Create: `app/api/tasks/[id]/route.ts`

- [ ] **Step 1: Create `app/api/tasks/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: profile.workspace_id,
      created_by: user.id,
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "new",
      priority: body.priority ?? "medium",
      deadline: body.deadline ?? null,
      assignee_id: body.assignee_id ?? null,
      related_event_id: body.related_event_id ?? null,
      related_contact_id: body.related_contact_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/tasks/[id]/route.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Verify**

Start dev server if not running: `npm run dev`
Open browser devtools → Network tab.
Navigate to `/tasks`. Open console and run:
```js
fetch('/api/tasks').then(r => r.json()).then(console.log)
```
Expected: `[]` (empty array) or array of task objects. No 401/500 errors.

---

## Task 2: React Query Hooks

**Files:**
- Create: `hooks/use-tasks.ts`

- [ ] **Step 1: Create `hooks/use-tasks.ts`**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskStatus, TaskPriority } from "@/types/database";

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      deadline?: string | null;
      assignee_id?: string | null;
      related_event_id?: string | null;
      related_contact_id?: string | null;
    }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Task> & { id: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Task>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
```

---

## Task 3: Task Utilities

**Files:**
- Create: `components/tasks/task-utils.ts`

- [ ] **Step 1: Create `components/tasks/task-utils.ts`**

```typescript
import type { Task, TaskStatus, TaskPriority } from "@/types/database";

// ── Priority ────────────────────────────────────────────────

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: string; className: string }> = {
  high:   { label: "Высокий", icon: "🔥", className: "bg-red-100 text-red-600" },
  medium: { label: "Средний", icon: "⚡", className: "bg-yellow-100 text-yellow-600" },
  low:    { label: "Низкий",  icon: "🌱", className: "bg-green-100 text-green-600" },
};

// ── Status ──────────────────────────────────────────────────

export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  new:         { label: "Новая",    className: "bg-violet-100 text-violet-600" },
  in_progress: { label: "В работе", className: "bg-blue-100 text-blue-600" },
  done:        { label: "Готово",   className: "bg-gray-100 text-gray-500" },
};

// ── Date helpers ─────────────────────────────────────────────

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export function isOverdue(dateStr: string | null, status: TaskStatus): boolean {
  if (!dateStr || status === "done") return false;
  return new Date(dateStr) < new Date() && !isToday(dateStr);
}

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(dateStr)) {
    const h = d.getHours(), m = d.getMinutes();
    return m === 0 ? `Сегодня ${h}:00` : `Сегодня ${h}:${String(m).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// ── Grouping (for "Все" tab) ──────────────────────────────────

export type TaskGroup = "overdue" | "today" | "upcoming" | "no_date";

export function getTaskGroup(task: Task): TaskGroup | null {
  if (task.status === "done") return null;
  if (!task.deadline) return "no_date";
  if (isOverdue(task.deadline, task.status)) return "overdue";
  if (isToday(task.deadline)) return "today";
  return "upcoming";
}

export const GROUP_CONFIG: Record<TaskGroup, { label: string; icon: string }> = {
  overdue:  { label: "Просрочено",   icon: "🔴" },
  today:    { label: "Сегодня",      icon: "🟡" },
  upcoming: { label: "Предстоящие",  icon: "📅" },
  no_date:  { label: "Без даты",     icon: "📋" },
};

export const GROUP_ORDER: TaskGroup[] = ["overdue", "today", "upcoming", "no_date"];

// ── Tab filtering ─────────────────────────────────────────────

export type TaskTab = "all" | "today" | "overdue" | "upcoming" | "done";

export function filterByTab(tasks: Task[], tab: TaskTab): Task[] {
  switch (tab) {
    case "all":      return tasks.filter(t => t.status !== "done");
    case "today":    return tasks.filter(t => isToday(t.deadline) && t.status !== "done");
    case "overdue":  return tasks.filter(t => isOverdue(t.deadline, t.status));
    case "upcoming": return tasks.filter(t => {
      if (!t.deadline || t.status === "done") return false;
      return !isToday(t.deadline) && !isOverdue(t.deadline, t.status);
    });
    case "done":     return tasks.filter(t => t.status === "done");
  }
}

export function groupTasks(tasks: Task[]): Record<TaskGroup, Task[]> {
  const groups: Record<TaskGroup, Task[]> = {
    overdue: [], today: [], upcoming: [], no_date: [],
  };
  for (const t of tasks) {
    const g = getTaskGroup(t);
    if (g) groups[g].push(t);
  }
  return groups;
}
```

---

## Task 4: TaskRow Component

**Files:**
- Create: `components/tasks/task-row.tsx`

- [ ] **Step 1: Create `components/tasks/task-row.tsx`**

```tsx
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
```

---

## Task 5: TaskDrawer Component

**Files:**
- Create: `components/tasks/task-drawer.tsx`

- [ ] **Step 1: Create `components/tasks/task-drawer.tsx`**

```tsx
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

  // Sync form when selected task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : "");
  }, [task?.id]);

  if (!task) return null;

  async function handleSave() {
    if (!task) return;
    await update.mutateAsync({
      id: task.id,
      title: title.trim() || task.title,
      description: description || null,
      status,
      priority,
      deadline: deadline || null,
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
            className="flex-1 text-base font-bold text-text-primary bg-transparent border-none outline-none resize-none leading-snug"
            placeholder="Название задачи"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
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
```

---

## Task 6: TaskQuickAdd Component

**Files:**
- Create: `components/tasks/task-quick-add.tsx`

- [ ] **Step 1: Create `components/tasks/task-quick-add.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_CONFIG } from "./task-utils";
import type { TaskPriority } from "@/types/database";

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
    onAdd({ title: title.trim(), deadline: deadline || null, priority });
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
```

---

## Task 7: TasksList Component

**Files:**
- Create: `components/tasks/tasks-list.tsx`

- [ ] **Step 1: Create `components/tasks/tasks-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { TaskRow } from "./task-row";
import { TaskQuickAdd } from "./task-quick-add";
import {
  filterByTab, groupTasks, GROUP_ORDER, GROUP_CONFIG,
  type TaskTab, type TaskGroup,
} from "./task-utils";
import type { Task } from "@/types/database";

const TABS: { id: TaskTab; label: string }[] = [
  { id: "all",      label: "Все" },
  { id: "today",    label: "Сегодня" },
  { id: "overdue",  label: "Просроченные" },
  { id: "upcoming", label: "Предстоящие" },
  { id: "done",     label: "Завершённые" },
];

interface Props {
  selectedTaskId: string | null;
  onSelectTask: (task: Task | null) => void;
}

export function TasksList({ selectedTaskId, onSelectTask }: Props) {
  const { data: allTasks = [], isLoading } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const [tab, setTab] = useState<TaskTab>("all");

  const filtered = filterByTab(allTasks, tab);
  const grouped = tab === "all" ? groupTasks(filtered) : null;

  function countTab(t: TaskTab) {
    return filterByTab(allTasks, t).length;
  }

  function handleToggleDone(task: Task) {
    const newStatus = task.status === "done" ? "new" : "done";
    update.mutate({ id: task.id, status: newStatus });
    if (selectedTaskId === task.id) onSelectTask(null);
  }

  function renderRow(task: Task) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        isActive={selectedTaskId === task.id}
        onSelect={() => onSelectTask(selectedTaskId === task.id ? null : task)}
        onToggleDone={() => handleToggleDone(task)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-0.5 px-5 pt-1 border-b border-border overflow-x-auto scrollbar-none flex-shrink-0">
        {TABS.map((t) => {
          const count = countTab(t.id);
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-text-primary"
              )}
            >
              {t.label}
              {count > 0 && (
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-primary text-white" :
                  t.id === "overdue" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckSquare size={36} className="mb-3 opacity-25" />
            <p className="font-semibold">Задач нет</p>
            <p className="text-xs mt-1">
              {tab === "done" ? "Завершённых задач пока нет" : "Создайте первую задачу"}
            </p>
          </div>
        ) : grouped ? (
          // "Все" tab — grouped
          GROUP_ORDER.map((group: TaskGroup) => {
            const tasks = grouped[group];
            if (tasks.length === 0) return null;
            const cfg = GROUP_CONFIG[group];
            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {cfg.icon} {cfg.label}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-1.5">
                  {tasks.map(renderRow)}
                </div>
              </div>
            );
          })
        ) : (
          // Other tabs — flat list
          <div className="space-y-1.5">{filtered.map(renderRow)}</div>
        )}

        {/* Quick add — only on non-done tabs */}
        {tab !== "done" && (
          <div className="mt-3">
            <TaskQuickAdd
              isLoading={create.isPending}
              onAdd={({ title, deadline, priority }) =>
                create.mutate({ title, deadline, priority })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Task 8: Kanban Components

**Files:**
- Create: `components/tasks/kanban-column.tsx`
- Create: `components/tasks/tasks-kanban.tsx`

- [ ] **Step 1: Create `components/tasks/kanban-column.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `components/tasks/tasks-kanban.tsx`**

```tsx
"use client";

import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { KanbanColumn } from "./kanban-column";
import type { Task, TaskStatus } from "@/types/database";

const COLUMNS: TaskStatus[] = ["new", "in_progress", "done"];

interface Props {
  selectedTaskId: string | null;
  onSelectTask: (task: Task | null) => void;
}

export function TasksKanban({ selectedTaskId, onSelectTask }: Props) {
  const { data: allTasks = [], isLoading } = useTasks();
  const update = useUpdateTask();

  function handleDrop(taskId: string, newStatus: TaskStatus) {
    update.mutate({ id: taskId, status: newStatus });
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 p-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-5 overflow-y-auto flex-1">
      {COLUMNS.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={allTasks.filter((t) => t.status === status)}
          selectedTaskId={selectedTaskId}
          onSelectTask={onSelectTask}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
```

---

## Task 9: Wire the Tasks Page

**Files:**
- Modify: `app/(workspace)/tasks/page.tsx`

- [ ] **Step 1: Replace tasks page with full implementation**

```tsx
"use client";

import { useState, useEffect } from "react";
import { List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { TasksList } from "@/components/tasks/tasks-list";
import { TasksKanban } from "@/components/tasks/tasks-kanban";
import { TaskDrawer } from "@/components/tasks/task-drawer";
import type { Task } from "@/types/database";

type ViewMode = "list" | "kanban";
const LS_KEY = "tasks-view";

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "list" || saved === "kanban") setView(saved);
  }, []);

  function switchView(v: ViewMode) {
    setView(v);
    localStorage.setItem(LS_KEY, v);
  }

  function handleSelectTask(task: Task | null) {
    setSelectedTask(task);
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-black text-text-primary">Задачи</h1>
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <button
            onClick={() => switchView("list")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-text-primary"
            )}
            title="Список"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => switchView("kanban")}
            className={cn(
              "p-2 rounded-lg transition-all",
              view === "kanban" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-text-primary"
            )}
            title="Канбан"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Body: view + drawer side by side */}
      <div className="flex flex-1 overflow-hidden">
        {view === "list" ? (
          <TasksList
            selectedTaskId={selectedTask?.id ?? null}
            onSelectTask={handleSelectTask}
          />
        ) : (
          <TasksKanban
            selectedTaskId={selectedTask?.id ?? null}
            onSelectTask={handleSelectTask}
          />
        )}

        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the full flow in browser**

With dev server running, open `http://localhost:3001/tasks` (or whichever port).

Check:
1. Page loads without errors — header + tabs visible, empty state shows
2. Click "+ Быстро добавить задачу..." → inline form expands → type title + Enter → task appears in list
3. Click a task row → drawer opens on the right with task fields
4. Change priority/status in drawer → click "Сохранить" → drawer updates
5. Click "✓ Завершить" → task moves to "Завершённые" tab, drawer closes
6. Click the Удалить button → confirm dialog appears → task disappears
7. Switch to kanban view (⊞ button) → three columns appear with tasks in correct columns
8. Drag a task card to a different column → status updates
9. Refresh page → view preference (list/kanban) is remembered

---

## Self-Review Notes

- ✅ All spec requirements covered: tabs, grouping, drawer, kanban, quick-add, delete confirmation, view persistence
- ✅ No TBDs or placeholders
- ✅ Types consistent: `TaskStatus`, `TaskPriority`, `Task` from `@/types/database` used throughout
- ✅ `onSelectTask` signature is `(task: Task | null) => void` consistently across all components
- ✅ `selectedTaskId` (not `selectedTask`) passed to list/kanban to avoid prop drilling the whole object
- ✅ Delete confirmation uses same `confirm()` pattern as rest of app
- ✅ View preference stored under `tasks-view` key (distinct from `booking-tab-order`)
