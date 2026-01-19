"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { taskFormSchema, TaskFormData } from "./schema";
import type { Task } from "@/types";

interface UseTaskFormOptions {
  task: Task | null;
  open: boolean;
  isEditing: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function useTaskForm({ task, open, isEditing, onClose, onUpdate }: UseTaskFormOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    values: task ? {
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      tags: task.tags || "",
      epicId: task.epicId,
    } : {
      title: "",
      description: "",
      status: "todo",
      priority: 2,
      tags: "",
      epicId: null,
    },
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  const { reset, formState: { isSubmitting } } = form;

  // Reset deleting state when modal opens/closes
  useEffect(() => {
    setIsDeleting(false);
  }, [open, isEditing]);

  const handleSave = async (data: TaskFormData) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim() || null,
          status: data.status,
          priority: data.priority,
          tags: data.tags.trim() || null,
          epicId: data.epicId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      toast.success("Task updated");
      onUpdate();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task");
      return false;
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
      }

      toast.success("Task deleted");
      onClose();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    const previousStatus = form.getValues("status");
    form.setValue("status", newStatus);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        form.setValue("status", previousStatus);
        throw new Error(error.error || "Failed to update status");
      }

      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handlePriorityChange = async (newPriority: number) => {
    if (!task) return;

    const previousPriority = form.getValues("priority");
    form.setValue("priority", newPriority);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        const error = await response.json();
        form.setValue("priority", previousPriority);
        throw new Error(error.error || "Failed to update priority");
      }

      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update priority");
    }
  };

  const handleCancel = () => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        tags: task.tags || "",
        epicId: task.epicId,
      });
    }
    setIsDeleting(false);
  };

  return {
    form,
    isSubmitting,
    isDeleting,
    setIsDeleting,
    handleSave,
    handleDelete,
    handleCancel,
    handleStatusChange,
    handlePriorityChange,
  };
}
