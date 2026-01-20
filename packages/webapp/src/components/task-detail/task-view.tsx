"use client";

import { Pencil } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb, BreadcrumbItem } from "@/components/breadcrumb";
import { CommentSection } from "@/components/comment-section";
import { TaskSidebar } from "./task-sidebar";
import type { Task, Epic } from "@/types";

interface TaskViewProps {
  task: Task;
  subtasks: Task[];
  breadcrumbItems: BreadcrumbItem[];
  status: string;
  priority: number;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onTaskClick?: (task: Task) => void;
  onEpicClick?: (epic: Epic) => void;
  getEpicById: (id: string) => Epic | undefined;
  getTaskById: (id: string) => Task | undefined;
}

export function TaskView({
  task,
  subtasks,
  breadcrumbItems,
  status,
  priority,
  open,
  onClose,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
  onEpicClick,
  getEpicById,
  getTaskById,
}: TaskViewProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Main content - scrollable */}
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="flex flex-col">
            {/* Title section */}
            <div className="px-4 pt-4 pb-2 flex justify-between items-start">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </div>

            {/* Description section */}
            <div className="px-4 pb-4">
              <h4 className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Description
              </h4>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No description
                </p>
              )}
            </div>

            {/* Sidebar - now at bottom for better scrolling */}
            <TaskSidebar
              task={{ ...task, status, priority }}
              subtasks={subtasks}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
              onEpicClick={onEpicClick}
              getEpicById={getEpicById}
              getTaskById={getTaskById}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
