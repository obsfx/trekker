"use client";

import type { Task, Epic } from "@/types";
import { KanbanColumn } from "./kanban-column";

const STATUS_COLUMNS = [
  { key: "todo", label: "TODO" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "wont_fix", label: "Won't Fix" },
  { key: "archived", label: "Archived" },
] as const;

interface KanbanBoardProps {
  tasks: Task[];
  epics: Epic[];
  onAddClick: (status: string) => void;
  onTaskClick: (task: Task) => void;
  onEpicClick: (epic: Epic) => void;
}

export function KanbanBoard({
  tasks,
  epics,
  onAddClick,
  onTaskClick,
  onEpicClick,
}: KanbanBoardProps) {
  const topLevelTasks = tasks.filter((task) => !task.parentTaskId);

  const getTasksByStatus = (status: string) =>
    topLevelTasks.filter((task) => task.status === status);

  const getEpicsByStatus = (status: string) =>
    epics.filter((epic) => epic.status === status);

  return (
    <div className="flex gap-4 items-start flex-nowrap min-h-[calc(100vh-180px)]">
      {STATUS_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.key}
          label={column.label}
          tasks={getTasksByStatus(column.key)}
          epics={getEpicsByStatus(column.key)}
          allTasks={tasks}
          allEpics={epics}
          onAddClick={() => onAddClick(column.key)}
          onTaskClick={onTaskClick}
          onEpicClick={onEpicClick}
        />
      ))}
    </div>
  );
}
