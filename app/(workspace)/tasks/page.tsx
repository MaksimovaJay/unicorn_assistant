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
