"use client";

import { Card } from "@/components/ui/card";
import type { Epic } from "@/types";
import { PriorityBadge } from "@/components/priority-badge";
import { Layers } from "lucide-react";

interface EpicCardProps {
  epic: Epic;
  taskCount: { total: number; completed: number };
  onClick: () => void;
}

export function EpicCard({ epic, taskCount, onClick }: EpicCardProps) {
  return (
    <div
      className="p-2 cursor-pointer bg-blue-50 dark:bg-blue-800 hover:ring"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Layers width={16} />
          <span className="font-mono text-xs font-medium text-foreground">
            {epic.id}
          </span>
        </div>
        <PriorityBadge priority={epic.priority} />
      </div>

      <h4 className="text-sm font-medium mb-2">{epic.title}</h4>

      <div className="border-t pt-1">
        <p className="text-xs text-muted-foreground">
          {taskCount.total} tasks · {taskCount.completed} completed
        </p>
      </div>
    </div>
  );
}
