"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { epicFormSchema, EpicFormData } from "./schema";

interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface UseEpicFormOptions {
  epic: Epic | null;
  open: boolean;
  isEditing: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function useEpicForm({ epic, open, isEditing, onClose, onUpdate }: UseEpicFormOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<EpicFormData>({
    resolver: zodResolver(epicFormSchema),
    values: epic ? {
      title: epic.title,
      description: epic.description || "",
      status: epic.status,
      priority: epic.priority,
    } : {
      title: "",
      description: "",
      status: "todo",
      priority: 2,
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

  const handleSave = async (data: EpicFormData) => {
    if (!epic) return;

    try {
      const response = await fetch(`/api/epics/${epic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim(),
          description: data.description.trim() || null,
          status: data.status,
          priority: data.priority,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update epic");
      }

      toast.success("Epic updated");
      onUpdate();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update epic");
      return false;
    }
  };

  const handleDelete = async () => {
    if (!epic) return;

    try {
      const response = await fetch(`/api/epics/${epic.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete epic");
      }

      toast.success("Epic deleted");
      onClose();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete epic");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!epic) return;

    const previousStatus = form.getValues("status");
    form.setValue("status", newStatus);

    try {
      const response = await fetch(`/api/epics/${epic.id}`, {
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
    if (!epic) return;

    const previousPriority = form.getValues("priority");
    form.setValue("priority", newPriority);

    try {
      const response = await fetch(`/api/epics/${epic.id}`, {
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
    if (epic) {
      reset({
        title: epic.title,
        description: epic.description || "",
        status: epic.status,
        priority: epic.priority,
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
