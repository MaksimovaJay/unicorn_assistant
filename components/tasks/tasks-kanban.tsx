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
