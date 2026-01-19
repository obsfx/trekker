"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";
import { getCardType } from "@/lib/constants";
import { PriorityBadge } from "@/components/priority-badge";
import { SubtaskProgress } from "@/components/subtask-progress";
import { SquareCheck } from "lucide-react";

interface TaskCardProps {
  task: Task;
  epicName: string | null;
  subtasks: Task[];
  onClick: () => void;
}

export function TaskCard({ task, epicName, subtasks, onClick }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cardType = getCardType(task);

  const completedSubtasks = subtasks.filter(
    (s) => s.status === "completed"
  ).length;

  return (
    <div
      data-task-id={task.id}
      className={`p-2 cursor-pointer hover:ring bg-accent w-full flex flex-col`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <SquareCheck width={16} />
          <span className="font-mono text-xs font-medium text-foreground">
            {task.id}
          </span>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <h4 className="text-sm font-medium mb-1">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {(epicName || task.tags) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {epicName && (
            <Badge variant="default" className="text-xs">
              {epicName}
            </Badge>
          )}
          {task.tags &&
            task.tags.split(",").map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
        </div>
      )}

      {(task.dependsOn.length > 0 || task.blocks.length > 0) && (
        <div className="pt-2 border-t">
          {task.dependsOn.length > 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Depends: {task.dependsOn.join(", ")}
            </p>
          )}
          {task.blocks.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Blocks: {task.blocks.join(", ")}
            </p>
          )}
        </div>
      )}

      {subtasks.length > 0 && (
        <SubtaskProgress completed={completedSubtasks} total={subtasks.length} />
      )}
    </div>
  );
}
