// Status types
export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "completed",
  "wont_fix",
  "archived",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const EPIC_STATUSES = [
  "todo",
  "in_progress",
  "completed",
  "archived",
] as const;

export type EpicStatus = (typeof EPIC_STATUSES)[number];

// Priority type (0-5, where 0 is highest priority)
export type Priority = 0 | 1 | 2 | 3 | 4 | 5;

// Entity types
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: EpicStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  epicId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  createdAt: Date;
}

// Input types for creating/updating entities
export interface CreateEpicInput {
  title: string;
  description?: string;
  status?: EpicStatus;
  priority?: Priority;
}

export interface UpdateEpicInput {
  title?: string;
  description?: string;
  status?: EpicStatus;
  priority?: Priority;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string;
  epicId?: string;
  parentTaskId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string;
  epicId?: string | null;
}

export interface CreateCommentInput {
  taskId: string;
  author: string;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

// Output options
export interface OutputOptions {
  json?: boolean;
}

// ID generation types
export type EntityType = "task" | "epic" | "comment";

export const PREFIX_MAP: Record<EntityType, string> = {
  task: "TREK",
  epic: "EPIC",
  comment: "CMT",
};
