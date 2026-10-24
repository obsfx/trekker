import dayjs from 'dayjs';
import type { HistoryAction, HistoryEntityType, HistoryEntry } from '@/src/services/history';
import type { EpicDetail, TaskDetail } from '@/src/services/item-detail';
import type { ItemSummary } from '@/src/services/items';
import type { Comment, ListEntityType, Priority, ProjectConfig, TaskStatus } from '@/src/types';
import type { FieldChange, EntityCounts, ErrorBody } from '@/src/types';

interface ProjectIdentityDto {
  name: string;
  root: string;
}

export abstract class DtoMappers {
  static readonly renderItemSummary = (item: ItemSummary): ItemSummaryDto => {
    return {
      kind: item.kind,
      id: item.id,
      title: item.title,
      status: item.status,
      priority: item.priority,
      rank: item.rank,
      tags: item.tags,
      epic: item.epic,
      parent: item.parent,
      subtasks: item.subtasks,
      blockedBy: item.blockedBy,
      progress: item.progress,
      commentCount: item.commentCount,
      createdAt: dayjs(item.createdAt).valueOf(),
      updatedAt: dayjs(item.updatedAt).valueOf(),
    };
  };

  static renderTaskDetail(task: TaskDetail): TaskDetailDto {
    return {
      ...DtoMappers.renderItemSummary(task),
      description: task.description,
      subtaskList: task.subtaskList,
      dependsOn: task.dependsOn,
      blocks: task.blocks,
    };
  }

  static renderEpicDetail(epic: EpicDetail): EpicDetailDto {
    return {
      ...DtoMappers.renderItemSummary(epic),
      description: epic.description,
      statusCounts: epic.statusCounts,
    };
  }

  static readonly renderComment = (comment: Comment): CommentDto => {
    return {
      id: comment.id,
      taskId: comment.taskId,
      author: comment.author,
      content: comment.content,
      createdAt: dayjs(comment.createdAt).valueOf(),
      updatedAt: dayjs(comment.updatedAt).valueOf(),
    };
  };

  private static camelKey(key: string): string {
    return key.replace(SNAKE_SEGMENT, (_match, letter: string) => {
      return letter.toUpperCase();
    });
  }

  private static camelKeys<T>(record: Record<string, T> | null): Record<string, T> | null {
    if (record === null) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => {
        return [DtoMappers.camelKey(key), value];
      })
    );
  }

  static readonly renderHistoryEvent = (event: HistoryEntry): HistoryEventDto => {
    return {
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      taskId: event.taskId,
      title: event.title,
      relatedIds: event.relatedIds,
      snapshot: DtoMappers.camelKeys(event.snapshot),
      changes: DtoMappers.camelKeys(event.changes),
      createdAt: dayjs(event.timestamp).valueOf(),
    };
  };

  static renderPage<T>(items: T[], nextCursor: string | null, total: number): PageDto<T> {
    return { items, nextCursor, total };
  }
}

export interface RefDto {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface CountDto {
  total: number;
  done: number;
}

export interface ItemSummaryDto {
  kind: ListEntityType;
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  rank: string | null;
  tags: string[];
  epic: RefDto | null;
  parent: RefDto | null;
  subtasks: CountDto;
  blockedBy: number;
  progress: CountDto | null;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SearchItemDto extends ItemSummaryDto {
  snippet: string | null;
}

export interface SubtaskRefDto extends RefDto {
  priority: Priority;
}

export interface TaskDetailDto extends ItemSummaryDto {
  description: string | null;
  subtaskList: SubtaskRefDto[];
  dependsOn: RefDto[];
  blocks: RefDto[];
}

export interface EpicDetailDto extends ItemSummaryDto {
  description: string | null;
  statusCounts: Record<TaskStatus, number>;
}

interface CommentDto {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface HistoryEventDto {
  id: number;
  action: HistoryAction;
  entityType: HistoryEntityType;
  entityId: string;
  taskId: string | null;
  title: string | null;
  relatedIds: string[];
  snapshot: Record<string, unknown> | null;
  changes: Record<string, FieldChange> | null;
  createdAt: number;
}

export interface PageDto<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface ProjectDto {
  name: string;
  root: string;
  version: string;
  config: ProjectConfig;
  counts: EntityCounts;
}

export interface ArchiveResultDto {
  tasks: number;
  epics: number;
}

export interface StreamPositionDto {
  lastEventId: number;
}

export interface ErrorDto {
  error: ErrorBody;
}

export interface TrekkerGlobal {
  baseUrl: string;
  version: string;
  project: ProjectIdentityDto;
}

const SNAKE_SEGMENT = /_([a-z])/g;
