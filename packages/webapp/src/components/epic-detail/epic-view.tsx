"use client";

import { Pencil } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb, BreadcrumbItem } from "@/components/breadcrumb";
import { EpicSidebar } from "./epic-sidebar";

interface Task {
  id: string;
  title: string;
  status: string;
  parentTaskId: string | null;
}

interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface EpicViewProps {
  epic: Epic;
  tasks: Task[];
  breadcrumbItems: BreadcrumbItem[];
  status: string;
  priority: number;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: number) => void;
  onTaskClick?: (task: Task) => void;
}

export function EpicView({
  epic,
  tasks,
  breadcrumbItems,
  status,
  priority,
  open,
  onClose,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onTaskClick,
}: EpicViewProps) {
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
              <h2 className="text-xl font-semibold">{epic.title}</h2>
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
              {epic.description ? (
                <p className="text-sm whitespace-pre-wrap">{epic.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No description
                </p>
              )}
            </div>

            {/* Sidebar - at bottom */}
            <EpicSidebar
              status={status}
              priority={priority}
              tasks={tasks}
              createdAt={epic.createdAt}
              updatedAt={epic.updatedAt}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onTaskClick={onTaskClick}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
