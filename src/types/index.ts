// Status types
export const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'wont_fix', 'archived'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const EPIC_STATUSES = ['todo', 'in_progress', 'completed', 'archived'] as const;

export type EpicStatus = (typeof EPIC_STATUSES)[number];

// Priority type (0-5, where 0 is highest priority)
export type Priority = 0 | 1 | 2 | 3 | 4 | 5;

// Default values
export const DEFAULT_PRIORITY: Priority = 2;
export const DEFAULT_TASK_STATUS: TaskStatus = 'todo';
export const DEFAULT_EPIC_STATUS: EpicStatus = 'todo';

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  LIST_PAGE_SIZE: 50,
  SEARCH_PAGE_SIZE: 20,
  HISTORY_PAGE_SIZE: 50,
  DEFAULT_PAGE: 1,
} as const;

// Generic paginated response
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items: T[];
}

// Valid sort fields for list operations
export const VALID_SORT_FIELDS = ['created', 'updated', 'title', 'priority', 'status'] as const;

// Valid entity types for list/search operations
export const LIST_ENTITY_TYPES = ['epic', 'task', 'subtask'] as const;
export const SEARCH_ENTITY_TYPES = ['epic', 'task', 'subtask', 'comment'] as const;

export type ListEntityType = (typeof LIST_ENTITY_TYPES)[number];
export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

// Entity types
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

export const PROJECT_CONFIG_KEYS = ['issue_prefix', 'epic_prefix', 'comment_prefix'] as const;

export type ProjectConfigKey = (typeof PROJECT_CONFIG_KEYS)[number];

export interface ProjectConfigEntry {
  key: ProjectConfigKey;
  value: string;
}

export type ProjectConfig = Record<ProjectConfigKey, string>;

export const PROJECT_CONFIG_DEFAULTS: ProjectConfig = {
  issue_prefix: 'TREK',
  epic_prefix: 'EPIC',
  comment_prefix: 'CMT',
};

// ID generation types
export type EntityType = 'task' | 'epic' | 'comment';

export const ENTITY_CONFIG_KEY_MAP: Record<EntityType, ProjectConfigKey> = {
  task: 'issue_prefix',
  epic: 'epic_prefix',
  comment: 'comment_prefix',
};
