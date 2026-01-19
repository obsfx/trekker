"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, Epic } from "@/types";
import { TaskCard } from "./task-card";
import { EpicCard } from "./epic-card";

interface KanbanColumnProps {
  label: string;
  tasks: Task[];
  epics: Epic[];
  allTasks: Task[];
  allEpics: Epic[];
  onAddClick: () => void;
  onTaskClick: (task: Task) => void;
  onEpicClick: (epic: Epic) => void;
}

export function KanbanColumn({
  label,
  tasks,
  epics,
  allTasks,
  allEpics,
  onAddClick,
  onTaskClick,
  onEpicClick,
}: KanbanColumnProps) {
  const totalCount = tasks.length + epics.length;

  const getEpicName = (epicId: string | null) => {
    if (!epicId) return null;
    const epic = allEpics.find((e) => e.id === epicId);
    return epic?.title || epicId;
  };

  const getSubtasks = (taskId: string) =>
    allTasks.filter((t) => t.parentTaskId === taskId);

  const getTaskCountForEpic = (epicId: string) => {
    const epicTasks = allTasks.filter(
      (t) => t.epicId === epicId && !t.parentTaskId
    );
    const completed = epicTasks.filter((t) => t.status === "completed").length;
    return { total: epicTasks.length, completed };
  };

  return (
    <div className="w-[280px] min-w-[280px] max-w-[320px] flex flex-col overflow-hidden border rounded-md">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b p-2 bg-accent/50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onAddClick}
          title={`Add task to ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 min-h-[100px]">
        <div className="flex flex-col gap-2 p-2">
          {epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              taskCount={getTaskCountForEpic(epic.id)}
              onClick={() => onEpicClick(epic)}
            />
          ))}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              epicName={getEpicName(task.epicId)}
              subtasks={getSubtasks(task.id)}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {totalCount === 0 && (
            <div className="flex items-center justify-center min-h-[80px] text-sm text-muted-foreground italic">
              No items
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
