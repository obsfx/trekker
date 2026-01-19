"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/shared";
import { TASK_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import type { Task, Epic } from "@/types";

interface DetailsSectionProps {
  task: Task;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onEpicClick?: (epic: Epic) => void;
  getEpicById: (id: string) => Epic | undefined;
}

export function DetailsSection({
  task,
  onStatusChange,
  onPriorityChange,
  onEpicClick,
  getEpicById,
}: DetailsSectionProps) {
  const epic = task.epicId ? getEpicById(task.epicId) : null;
  const tags = task.tags ? task.tags.split(",").map((t) => t.trim()) : [];

  const handleEpicClick = () => {
    if (epic && onEpicClick) {
      onEpicClick(epic);
    }
  };

  return (
    <div>
      <SectionHeader>Details</SectionHeader>

      <div className="space-y-2">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select value={task.status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-auto h-8 text-right">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Priority</span>
          <Select
            value={task.priority.toString()}
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

        {/* Epic */}
        {epic && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Epic</span>
            <button
              className="flex items-center gap-0.5 text-sm text-purple-500 hover:text-purple-600"
              onClick={handleEpicClick}
            >
              {epic.id}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Tags</span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
