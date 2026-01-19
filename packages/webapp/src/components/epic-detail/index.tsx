"use client";

import { useState } from "react";
import { BreadcrumbItem } from "@/components/breadcrumb";
import { EpicView } from "./epic-view";
import { EpicEdit } from "./epic-edit";
import { useEpicForm } from "./use-epic-form";

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

interface EpicDetailModalProps {
  epic: Epic | null;
  tasks?: Task[];
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onTaskClick?: (task: Task) => void;
}

export function EpicDetailModal({
  epic,
  tasks = [],
  open,
  onClose,
  onUpdate,
  onTaskClick,
}: EpicDetailModalProps) {
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
  } = useEpicForm({ epic, open, isEditing, onClose, onUpdate });

  // Reset editing state when modal closes
  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!epic) return null;

  const breadcrumbItems: BreadcrumbItem[] = [
    { id: epic.id, title: epic.title, type: "epic" },
  ];

  const status = form.watch("status");
  const priority = form.watch("priority");

  const handleEditCancel = () => {
    handleCancel();
    setIsEditing(false);
  };

  return (
    <>
      <EpicView
        epic={epic}
        tasks={tasks}
        breadcrumbItems={breadcrumbItems}
        status={status}
        priority={priority}
        open={open && !isEditing}
        onClose={handleClose}
        onEdit={() => setIsEditing(true)}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onTaskClick={onTaskClick}
      />

      <EpicEdit
        form={form}
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
