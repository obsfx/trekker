"use client";

import { Square, SquareCheck as CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader, Metadata } from "@/components/shared";
import { EPIC_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";

interface Task {
  id: string;
  title: string;
  status: string;
  parentTaskId: string | null;
}

interface EpicSidebarProps {
  status: string;
  priority: number;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onTaskClick?: (task: Task) => void;
}

export function EpicSidebar({
  status,
  priority,
  tasks,
  createdAt,
  updatedAt,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
}: EpicSidebarProps) {
  const epicTasks = tasks.filter((t) => !t.parentTaskId);
  const completedTasks = epicTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="p-4 bg-muted/30 rounded-b-md">
      <div className="space-y-6">
        {/* Details section */}
        <div>
          <SectionHeader>Details</SectionHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-auto h-8 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EPIC_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Select
                value={priority.toString()}
                onValueChange={(v) => onPriorityChange(parseInt(v, 10))}
              >
                <SelectTrigger className="w-auto h-8 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      P{value} - {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tasks section */}
        {epicTasks.length > 0 && (
          <div>
            <SectionHeader count={{ current: completedTasks, total: epicTasks.length }}>
              Tasks
            </SectionHeader>
            <div className="space-y-1">
              {epicTasks.map((task) => (
                <Button
                  key={task.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-1.5 gap-2"
                  onClick={() => onTaskClick?.(task)}
                >
                  {task.status === "completed" ? (
                    <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 opacity-50 shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {task.id}
                  </span>
                  <span
                    className={cn(
                      "text-sm flex-1 text-left truncate",
                      task.status === "completed" && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Metadata createdAt={createdAt} updatedAt={updatedAt} />
      </div>
    </div>
  );
}
