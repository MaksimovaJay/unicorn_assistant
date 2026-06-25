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
  const { data: allTasks = [], isLoading, error: queryError } = useTasks();
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
        {queryError && (
          <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
            Ошибка загрузки: {queryError.message}
          </div>
        )}
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
                create.mutate({ title, deadline, priority }, {
                  onError: (e) => alert("Ошибка создания задачи: " + e.message),
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
