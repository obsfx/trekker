import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: z.string(),
  priority: z.number().min(0).max(5),
  tags: z.string(),
  epicId: z.string().nullable(),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;
