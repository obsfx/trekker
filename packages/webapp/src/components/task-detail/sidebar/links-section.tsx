"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/shared";
import type { Task } from "@/types";

interface LinksSectionProps {
  dependsOn: string[];
  blocks: string[];
  onTaskClick?: (task: Task) => void;
  getTaskById: (id: string) => Task | undefined;
}

interface TaskLinkProps {
  taskId: string;
  variant: "depends" | "blocks";
  onClick: () => void;
}

function TaskLink({ taskId, variant, onClick }: TaskLinkProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-0.5 text-sm hover:underline",
        variant === "depends" && "text-yellow-600 dark:text-yellow-400",
        variant === "blocks" && "text-red-600 dark:text-red-400"
      )}
      onClick={onClick}
    >
      <span className="font-mono">{taskId}</span>
      <ChevronRight className="h-3 w-3" />
    </button>
  );
}

export function LinksSection({
  dependsOn,
  blocks,
  onTaskClick,
  getTaskById,
}: LinksSectionProps) {
  const hasLinks = dependsOn.length > 0 || blocks.length > 0;

  if (!hasLinks) {
    return null;
  }

  const handleTaskClick = (taskId: string) => {
    const task = getTaskById(taskId);
    if (task && onTaskClick) {
      onTaskClick(task);
    }
  };

  return (
    <div>
      <SectionHeader>Links</SectionHeader>

      {dependsOn.length > 0 && (
        <div className="mb-2">
          <span className="text-xs text-muted-foreground mb-1 block">
            Depends on
          </span>
          <div className="space-y-1">
            {dependsOn.map((depId) => (
              <TaskLink
                key={depId}
                taskId={depId}
                variant="depends"
                onClick={() => handleTaskClick(depId)}
              />
            ))}
          </div>
        </div>
      )}

      {blocks.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground mb-1 block">
            Blocks
          </span>
          <div className="space-y-1">
            {blocks.map((blockId) => (
              <TaskLink
                key={blockId}
                taskId={blockId}
                variant="blocks"
                onClick={() => handleTaskClick(blockId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
