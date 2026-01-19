"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, SquareCheck, GitBranch } from "lucide-react";
import { CreateForm } from "./create-form";
import { useCreateForm } from "./use-create-form";
import type { CreateType, Epic, Task } from "@/types";

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  epics: Epic[];
  tasks: Task[];
  defaultStatus?: string;
  defaultType?: CreateType;
}

const TYPE_ICONS = {
  epic: Layers,
  task: SquareCheck,
  subtask: GitBranch,
};

interface CreateFormWrapperProps {
  type: CreateType;
  defaultStatus?: string;
  onClose: () => void;
  onCreated: () => void;
  epics: Epic[];
  parentTasks: Task[];
}

function CreateFormWrapper({
  type,
  defaultStatus,
  onClose,
  onCreated,
  epics,
  parentTasks,
}: CreateFormWrapperProps) {
  const { form, isSubmitting, handleSubmit } = useCreateForm({
    type,
    defaultStatus,
    onClose,
    onCreated,
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4">
        <CreateForm
          form={form}
          type={type}
          epics={epics}
          parentTasks={parentTasks}
        />
      </div>

      <div className="flex justify-end gap-2 p-4 border-t mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}

export function CreateModal({
  open,
  onClose,
  onCreated,
  epics,
  tasks,
  defaultStatus,
  defaultType,
}: CreateModalProps) {
  const [type, setType] = useState<CreateType>("task");

  // Reset type when modal opens
  useEffect(() => {
    if (open) {
      setType(defaultType || "task");
    }
  }, [open, defaultType]);

  const parentTasks = tasks.filter((t) => !t.parentTaskId);
  const Icon = TYPE_ICONS[type];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 border-b p-4">
            <Icon className="h-5 w-5" />
            Create New {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 px-4">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as CreateType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="epic">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Epic
                </div>
              </SelectItem>
              <SelectItem value="task">
                <div className="flex items-center gap-2">
                  <SquareCheck className="h-4 w-4" />
                  Task
                </div>
              </SelectItem>
              <SelectItem value="subtask">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Subtask
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>


        <CreateFormWrapper
          key={type}
          type={type}
          defaultStatus={defaultStatus}
          onClose={onClose}
          onCreated={onCreated}
          epics={epics}
          parentTasks={parentTasks}
        />
      </DialogContent>
    </Dialog>
  );
}
