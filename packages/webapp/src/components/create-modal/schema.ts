import { z } from "zod";

export const baseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: z.string(),
  priority: z.number().min(0).max(5),
});

export const epicFormSchema = baseFormSchema;

export const taskFormSchema = baseFormSchema.extend({
  tags: z.string(),
  epicId: z.string().nullable(),
});

export const subtaskFormSchema = baseFormSchema.extend({
  tags: z.string(),
  parentTaskId: z.string().min(1, "Parent task is required"),
});

export type EpicFormData = z.infer<typeof epicFormSchema>;
export type TaskFormData = z.infer<typeof taskFormSchema>;
export type SubtaskFormData = z.infer<typeof subtaskFormSchema>;

export type CreateFormData = EpicFormData | TaskFormData | SubtaskFormData;
