"use client";

import { UseFormReturn, Controller } from "react-hook-form";
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
import {
  EPIC_STATUSES,
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import type { CreateType, Epic, Task } from "@/types";

interface CreateFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  type: CreateType;
  epics: Epic[];
  parentTasks: Task[];
}

export function CreateForm({ form, type, epics, parentTasks }: CreateFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const statusOptions = type === "epic" ? EPIC_STATUSES : TASK_STATUSES;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label>
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          {...register("title")}
          placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} title`}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register("description")}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(parseInt(v, 10))}
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
            )}
          />
        </div>
      </div>

      {type === "task" && (
        <TaskFields form={form} epics={epics} />
      )}

      {type === "subtask" && (
        <SubtaskFields form={form} parentTasks={parentTasks} />
      )}
    </div>
  );
}

interface TaskFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  epics: Epic[];
}

function TaskFields({ form, epics }: TaskFieldsProps) {
  const { register, control } = form;

  return (
    <>
      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          {...register("tags")}
          placeholder="bug, frontend, urgent"
        />
      </div>

      <div className="space-y-2">
        <Label>Epic</Label>
        <Controller
          control={control}
          name="epicId"
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(v) => field.onChange(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Epic</SelectItem>
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.id}: {epic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </>
  );
}

interface SubtaskFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  parentTasks: Task[];
}

function SubtaskFields({ form, parentTasks }: SubtaskFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          {...register("tags")}
          placeholder="bug, frontend, urgent"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Parent Task <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="parentTaskId"
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a task...</SelectItem>
                {parentTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.id}: {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.parentTaskId && (
          <p className="text-sm text-destructive">{errors.parentTaskId.message as string}</p>
        )}
      </div>
    </>
  );
}
