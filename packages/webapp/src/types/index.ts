// Re-export shared types and constants
export {
  TASK_STATUSES,
  EPIC_STATUSES,
  PREFIX_MAP,
  type TaskStatus,
  type EpicStatus,
  type Priority,
  type EntityType,
  type CreateEpicInput,
  type UpdateEpicInput,
  type CreateTaskInput,
  type UpdateTaskInput,
  type CreateCommentInput,
  type UpdateCommentInput,
} from "@trekker/shared";

// Webapp-specific types (dates as strings from JSON API)
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  epicId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined from dependencies table
  dependsOn: string[];
  blocks: string[];
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  createdAt: string;
}

export type CreateType = "epic" | "task" | "subtask";

export interface CreateModalDefaults {
  status?: string;
  type?: CreateType;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected";
