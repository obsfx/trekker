"use client";

import { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem } from "@/components/breadcrumb";
import { DeleteConfirmation } from "@/components/shared";
import { EPIC_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { EpicFormData } from "./schema";

interface EpicEditProps {
  form: UseFormReturn<EpicFormData>;
  breadcrumbItems: BreadcrumbItem[];
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSubmit: (data: EpicFormData) => Promise<boolean | undefined>;
  onCancel: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function EpicEdit({
  form,
  breadcrumbItems,
  open,
  isDeleting,
  onClose,
  onSubmit,
  onCancel,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: EpicEditProps) {
  const { watch, setValue, handleSubmit, formState: { isSubmitting, errors } } = form;
  const title = watch("title");
  const description = watch("description");
  const status = watch("status");
  const priority = watch("priority");

  const handleFormSubmit = async (data: EpicFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <div className="flex items-center p-4 border-b">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <form id="epic-edit-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4">

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setValue("title", e.target.value)}
              placeholder="Epic title"
              className="text-lg font-semibold"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setValue("description", e.target.value)}
              placeholder="Epic description"
              rows={4}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EPIC_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority.toString()}
                onValueChange={(v) => setValue("priority", parseInt(v, 10))}
              >
                <SelectTrigger>
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
          </div>

        </form>

        {/* Footer with actions */}
        <div className="p-4 border-t flex items-center justify-between">
          <DeleteConfirmation
            isConfirming={isDeleting}
            entityName="Epic"
            onDelete={onDelete}
            onConfirm={onDeleteConfirm}
            onCancel={onDeleteCancel}
          />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="epic-edit-form"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
