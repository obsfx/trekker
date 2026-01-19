"use client";

import { useState, useCallback } from "react";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { TaskView } from "./task-view";
import { TaskEdit } from "./task-edit";
import { useTaskForm } from "./use-task-form";
import type { Task, Epic } from "@/types";

interface TaskDetailModalProps {
  task: Task | null;
  epics: Epic[];
  allTasks: Task[];
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onTaskClick?: (task: Task) => void;
  onEpicClick?: (epic: Epic) => void;
}

export function TaskDetailModal({
  task,
  epics,
  allTasks,
  open,
  onClose,
  onUpdate,
  onTaskClick,
  onEpicClick,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    form,
    isDeleting,
    setIsDeleting,
    handleSave,
    handleDelete,
    handleCancel,
    handleStatusChange,
    handlePriorityChange,
  } = useTaskForm({ task, open, isEditing, onClose, onUpdate });

  const getEpicById = useCallback(
    (id: string) => epics.find((e) => e.id === id),
    [epics]
  );

  const getTaskById = useCallback(
    (id: string) => allTasks.find((t) => t.id === id),
    [allTasks]
  );

  const getParentTask = useCallback(
    (id: string | null) => (id ? allTasks.find((t) => t.id === id) : null),
    [allTasks]
  );

  // Reset editing state when modal closes or task changes
  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!task) return null;

  const isSubtask = !!task.parentTaskId;
  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id);

  const buildBreadcrumb = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const epic = task.epicId ? getEpicById(task.epicId) : null;
    const parentTask = getParentTask(task.parentTaskId);

    if (epic) {
      items.push({
        id: epic.id,
        title: epic.title,
        type: "epic",
        onClick: onEpicClick ? () => onEpicClick(epic) : undefined,
      });
    }

    if (parentTask) {
      items.push({
        id: parentTask.id,
        title: parentTask.title,
        type: "task",
        onClick: onTaskClick ? () => onTaskClick(parentTask) : undefined,
      });
    }

    items.push({
      id: task.id,
      title: task.title,
      type: isSubtask ? "subtask" : "task",
    });

    return items;
  };

  const breadcrumbItems = buildBreadcrumb();
  const status = form.watch("status");
  const priority = form.watch("priority");

  const handleEditCancel = () => {
    handleCancel();
    setIsEditing(false);
  };

  return (
    <>
      <TaskView
        task={task}
        subtasks={subtasks}
        breadcrumbItems={breadcrumbItems}
        status={status}
        priority={priority}
        open={open && !isEditing}
        onClose={handleClose}
        onEdit={() => setIsEditing(true)}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onTaskClick={onTaskClick}
        onEpicClick={onEpicClick}
        getEpicById={getEpicById}
        getTaskById={getTaskById}
      />

      <TaskEdit
        form={form}
        epics={epics}
        breadcrumbItems={breadcrumbItems}
        open={open && isEditing}
        isDeleting={isDeleting}
        onClose={handleClose}
        onSubmit={handleSave}
        onCancel={handleEditCancel}
        onDelete={() => setIsDeleting(true)}
        onDeleteConfirm={handleDelete}
        onDeleteCancel={() => setIsDeleting(false)}
      />
    </>
  );
}
