import { z } from "zod";

export const epicFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: z.string(),
  priority: z.number().min(0).max(5),
});

export type EpicFormData = z.infer<typeof epicFormSchema>;
