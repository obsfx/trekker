"use client";

import { Button } from "@/components/ui/button";

interface DeleteConfirmationProps {
  isConfirming: boolean;
  entityName: string;
  onDelete: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmation({
  isConfirming,
  entityName,
  onDelete,
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive">Delete?</span>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          Yes
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onDelete}
    >
      Delete {entityName}
    </Button>
  );
}
