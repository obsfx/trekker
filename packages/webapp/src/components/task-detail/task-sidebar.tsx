"use client";

import { DetailsSection, LinksSection, SubtasksSection } from "./sidebar";
import { Metadata } from "@/components/shared";
import type { Task, Epic } from "@/types";
import { CommentSection } from "../comment-section";

interface TaskSidebarProps {
  task: Task;
  subtasks: Task[];
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onTaskClick?: (task: Task) => void;
  onEpicClick?: (epic: Epic) => void;
  getEpicById: (id: string) => Epic | undefined;
  getTaskById: (id: string) => Task | undefined;
}

export function TaskSidebar({
  task,
  subtasks,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  onEpicClick,
  getEpicById,
  getTaskById,
}: TaskSidebarProps) {
  return (
    <div className="bg-muted/50 rounded-b-md">
      <div className="p-4 space-y-6">
        <DetailsSection
          task={task}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
          onEpicClick={onEpicClick}
          getEpicById={getEpicById}
        />

        <LinksSection
          dependsOn={task.dependsOn}
          blocks={task.blocks}
          onTaskClick={onTaskClick}
          getTaskById={getTaskById}
        />

        <SubtasksSection subtasks={subtasks} onTaskClick={onTaskClick} />
        <Metadata createdAt={task.createdAt} updatedAt={task.updatedAt} />
      </div>


      <CommentSection taskId={task.id} />
    </div>
  );
}
