import * as v from 'valibot';

import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

const HISTORY_ACTIONS = ['create', 'update', 'delete'] as const;
const HISTORY_ENTITIES = ['epic', 'task', 'subtask', 'comment', 'dependency'] as const;

export type HistoryAction = (typeof HISTORY_ACTIONS)[number];
export type HistoryEntity = (typeof HISTORY_ENTITIES)[number];

export interface FieldChange {
  from: unknown;
  to: unknown;
}

export interface HistoryEvent {
  id: number;
  action: HistoryAction;
  entityType: HistoryEntity;
  entityId: string;
  taskId: string | null;
  title: string | null;
  relatedIds: string[];
  snapshot: Record<string, unknown> | null;
  changes: Record<string, FieldChange> | null;
  createdAt: number;
}

export interface HistoryQuery {
  types: HistoryEntity[];
  actions: HistoryAction[];
  entityId: string | null;
  from?: number | null;
  to?: number | null;
}

export abstract class HistoryShapes {
  static readonly actions: readonly HistoryAction[] = HISTORY_ACTIONS;
  static readonly entities: readonly HistoryEntity[] = HISTORY_ENTITIES;

  static readonly event = v.object({
    id: ValueSchemas.count,
    action: v.picklist(HISTORY_ACTIONS),
    entityType: v.picklist(HISTORY_ENTITIES),
    entityId: v.string(),
    taskId: v.fallback(v.nullable(v.string()), null),
    title: v.fallback(v.nullable(v.string()), null),
    relatedIds: v.fallback(v.array(v.string()), []),
    snapshot: v.fallback(v.nullable(v.record(v.string(), v.unknown())), null),
    changes: v.fallback(
      v.nullable(v.record(v.string(), v.object({ from: v.unknown(), to: v.unknown() }))),
      null
    ),
    createdAt: ValueSchemas.timestamp,
  });

  static readonly emptyQuery: HistoryQuery = { types: [], actions: [], entityId: null };

  static parse(value: unknown): HistoryEvent | null {
    const result = v.safeParse(HistoryShapes.event, value);
    if (result.success) {
      return result.output;
    }
    return null;
  }

  static key(query: HistoryQuery) {
    return JSON.stringify([
      [...query.types].sort(),
      [...query.actions].sort(),
      query.entityId,
      query.from ?? null,
      query.to ?? null,
    ]);
  }

  static params(query: HistoryQuery, cursor: string | null, limit: number) {
    const params = new URLSearchParams();
    if (query.types.length > 0) {
      params.set('type', query.types.join(','));
    }
    if (query.actions.length > 0) {
      params.set('action', query.actions.join(','));
    }
    if (query.entityId) {
      params.set('entity', query.entityId);
    }
    if (query.from !== undefined && query.from !== null) {
      params.set('from', String(query.from));
    }
    if (query.to !== undefined && query.to !== null) {
      params.set('to', String(query.to));
    }
    params.set('limit', String(limit));
    if (cursor) {
      params.set('cursor', cursor);
    }
    return params;
  }

  static matches(query: HistoryQuery, event: HistoryEvent) {
    if (query.types.length > 0 && !query.types.includes(event.entityType)) {
      return false;
    }
    if (query.actions.length > 0 && !query.actions.includes(event.action)) {
      return false;
    }
    if (query.entityId && event.entityId !== query.entityId && event.taskId !== query.entityId) {
      return false;
    }
    if (query.from !== undefined && query.from !== null && event.createdAt < query.from) {
      return false;
    }
    if (query.to !== undefined && query.to !== null && event.createdAt >= query.to) {
      return false;
    }
    return !(event.action === 'update' && event.changes && Object.keys(event.changes).length === 0);
  }

  static affectedIds(event: HistoryEvent) {
    const ids = new Set<string>();
    if (
      event.entityType === 'epic' ||
      event.entityType === 'task' ||
      event.entityType === 'subtask'
    ) {
      ids.add(event.entityId);
    }
    if (event.taskId) {
      ids.add(event.taskId);
    }
    for (const id of event.relatedIds) {
      ids.add(id);
    }
    for (const key of ['taskId', 'dependsOnId', 'parentTaskId', 'epicId']) {
      const value = event.snapshot?.[key];
      if (typeof value === 'string') {
        ids.add(value);
      }
    }
    return ids;
  }
}
