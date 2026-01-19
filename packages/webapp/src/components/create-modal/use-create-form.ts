"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  epicFormSchema,
  taskFormSchema,
  subtaskFormSchema,
  type EpicFormData,
  type TaskFormData,
  type SubtaskFormData,
} from "./schema";
import type { CreateType } from "@/types";

interface UseCreateFormOptions {
  type: CreateType;
  defaultStatus?: string;
  onClose: () => void;
  onCreated: () => void;
}

const getSchema = (type: CreateType) => {
  switch (type) {
    case "epic":
      return epicFormSchema;
    case "subtask":
      return subtaskFormSchema;
    default:
      return taskFormSchema;
  }
};

const getDefaultValues = (type: CreateType, defaultStatus?: string) => {
  const base = {
    title: "",
    description: "",
    status: defaultStatus || "todo",
    priority: 2,
  };

  if (type === "epic") {
    return base;
  }

  if (type === "subtask") {
    return { ...base, tags: "", parentTaskId: "" };
  }

  return { ...base, tags: "", epicId: null };
};

export function useCreateForm({
  type,
  defaultStatus,
  onClose,
  onCreated,
}: UseCreateFormOptions) {
  const form = useForm({
    resolver: zodResolver(getSchema(type)),
    defaultValues: getDefaultValues(type, defaultStatus),
  });

  const {
    formState: { isSubmitting },
  } = form;

  const createEpic = async (data: EpicFormData) => {
    const response = await fetch("/api/epics", {
      method: "POST",
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
      throw new Error(error.error || "Failed to create epic");
    }

    return response.json();
  };

  const createTask = async (data: TaskFormData) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title.trim(),
        description: data.description.trim() || null,
        status: data.status,
        priority: data.priority,
        tags: data.tags.trim() || null,
        epicId: data.epicId || null,
        parentTaskId: null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create task");
    }

    return response.json();
  };

  const createSubtask = async (data: SubtaskFormData) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title.trim(),
        description: data.description.trim() || null,
        status: data.status,
        priority: data.priority,
        tags: data.tags.trim() || null,
        epicId: null,
        parentTaskId: data.parentTaskId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create subtask");
    }

    return response.json();
  };

  const handleSubmit = form.handleSubmit(
    async (data) => {
      try {
        let created;

        switch (type) {
          case "epic":
            created = await createEpic(data as EpicFormData);
            toast.success(`Epic ${created.id} created`);
            break;
          case "subtask":
            created = await createSubtask(data as SubtaskFormData);
            toast.success(`Subtask ${created.id} created`);
            break;
          default:
            created = await createTask(data as TaskFormData);
            toast.success(`Task ${created.id} created`);
        }

        onClose();
        onCreated();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create");
      }
    },
    (errors) => {
      // Show first validation error as toast
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      }
    }
  );

  return {
    form,
    isSubmitting,
    handleSubmit,
  };
}
