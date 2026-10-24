import type { EpicDetail, TaskComment, TaskDetail } from '@/ui/lib/detail-shapes.ts';
import type { HistoryEvent, HistoryQuery } from '@/ui/lib/history-shapes.ts';
import type { ItemQuery } from '@/ui/lib/item-queries.ts';
import type { ItemSummary, Page } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import type { ProjectInfo } from '@/ui/lib/project-shapes.ts';
import type { SearchQuery } from '@/ui/lib/search-queries.ts';

export interface ItemMove {
  status: ItemStatus;
  anchorId: string | null;
  placement: 'before' | 'after';
}

export interface SearchHit extends ItemSummary {
  snippet: string | null;
}

export interface ArchiveResult {
  tasks: number;
  epics: number;
}

export interface TaskDraft {
  title: string;
  description: string | null;
  priority: Priority;
  status: ItemStatus;
  epicId: string | null;
  parentTaskId: string | null;
  tags: string[];
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: ItemStatus;
  epicId?: string | null;
  tags?: string[];
}

export interface EpicDraft {
  title: string;
  description: string | null;
  priority: Priority;
  status: ItemStatus;
}

export interface EpicPatch {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: ItemStatus;
}

export interface ItemGateway {
  list: (query: ItemQuery, cursor: string | null) => Promise<Page<ItemSummary>>;
  count: (query: ItemQuery) => Promise<number>;
  byIds: (ids: string[]) => Promise<ItemSummary[]>;
  search: (query: SearchQuery, cursor: string | null) => Promise<Page<SearchHit>>;
  move: (id: string, move: ItemMove) => Promise<ItemSummary>;
  archiveCompleted: () => Promise<ArchiveResult>;
}

export interface TaskGateway {
  get: (id: string) => Promise<TaskDetail>;
  create: (draft: TaskDraft) => Promise<TaskDetail>;
  update: (id: string, patch: TaskPatch) => Promise<TaskDetail>;
  remove: (id: string) => Promise<void>;
  comments: (taskId: string, cursor: string | null) => Promise<Page<TaskComment>>;
  addComment: (taskId: string, author: string, content: string) => Promise<TaskComment>;
  updateComment: (id: string, content: string) => Promise<TaskComment>;
  removeComment: (id: string) => Promise<void>;
  addDependency: (taskId: string, dependsOnId: string) => Promise<TaskDetail>;
  removeDependency: (taskId: string, dependsOnId: string) => Promise<TaskDetail>;
}

export interface EpicGateway {
  get: (id: string) => Promise<EpicDetail>;
  create: (draft: EpicDraft) => Promise<EpicDetail>;
  update: (id: string, patch: EpicPatch) => Promise<EpicDetail>;
  remove: (id: string) => Promise<void>;
}

export interface HistoryGateway {
  list: (query: HistoryQuery, cursor: string | null) => Promise<Page<HistoryEvent>>;
}

export interface ProjectGateway {
  load: () => Promise<ProjectInfo>;
  updateConfig: (config: Record<string, string>) => Promise<ProjectInfo>;
}
