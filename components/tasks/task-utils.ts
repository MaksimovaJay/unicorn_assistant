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
