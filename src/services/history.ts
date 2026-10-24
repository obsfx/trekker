import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import { PAGINATION_DEFAULTS } from '@/src/types';
import { IDS_PARAM, BatchQueries } from '@/src/services/batch-query';
import type { FieldChange } from '@/src/types';

export abstract class HistoryService {
  private static readonly toHistoryEvent = (row: HistoryRow): HistoryEvent => {
    let snapshot: Record<string, unknown> | null = null;
    if (row.snapshot) {
      snapshot = parseJsonRecord(row.snapshot);
    }

    let changes: Record<string, FieldChange> | null = null;
    if (row.changes) {
      changes = parseJsonChanges(row.changes);
    }

    return {
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      snapshot,
      changes,
      timestamp: dayjs(row.created_at).toDate(),
    };
  };

  private static historyConditions(filter?: HistoryFilter): ConditionList {
    const clauses: string[] = ["NOT (action = 'update' AND changes = '{}')"];
    const params: (string | number)[] = [];

    if (filter?.entityId) {
      clauses.push('entity_id = ?');
      params.push(filter.entityId);
    }

    if (filter?.ownedBy) {
      clauses.push(`(entity_id = ?
        OR (entity_type = 'comment' AND (json_extract(snapshot, '$.task_id') = ?
          OR entity_id IN (SELECT id FROM comments WHERE task_id = ?)))
        OR (entity_type = 'dependency' AND json_extract(snapshot, '$.task_id') = ?))`);
      params.push(filter.ownedBy, filter.ownedBy, filter.ownedBy, filter.ownedBy);
    }

    if (filter?.types && filter.types.length > 0) {
      const placeholders = filter.types
        .map(() => {
          return '?';
        })
        .join(', ');
      clauses.push(`entity_type IN (${placeholders})`);
      params.push(...filter.types);
    }

    if (filter?.actions && filter.actions.length > 0) {
      const placeholders = filter.actions
        .map(() => {
          return '?';
        })
        .join(', ');
      clauses.push(`action IN (${placeholders})`);
      params.push(...filter.actions);
    }

    if (filter?.since) {
      clauses.push('created_at >= ?');
      params.push(dayjs(filter.since).valueOf());
    }

    if (filter?.until) {
      clauses.push('created_at <= ?');
      params.push(dayjs(filter.until).valueOf());
    }

    return { clauses, params };
  }

  private static toWhere(clauses: string[], params: (string | number)[]): WhereClause {
    if (clauses.length === 0) {
      return { sql: '', params };
    }
    return { sql: `WHERE ${clauses.join(' AND ')}`, params };
  }

  private static countEvents(where: WhereClause): number {
    const row = DbClient.requireSqliteInstance()
      .query<HistoryCountRow, (string | number)[]>(
        `SELECT COUNT(*) as total FROM events ${where.sql}`
      )
      .get(...where.params);
    return row?.total ?? 0;
  }

  static getHistory(options?: HistoryOptions): HistoryResponse {
    const sqlite = DbClient.requireSqliteInstance();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.HISTORY_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    const { clauses, params } = HistoryService.historyConditions(options);
    const where = HistoryService.toWhere(clauses, params);

    const results = sqlite
      .query<HistoryRow, (string | number)[]>(
        `SELECT ${HISTORY_COLUMNS} FROM events ${where.sql}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`
      )
      .all(...where.params, limit, offset);

    return {
      total: HistoryService.countEvents(where),
      page,
      limit,
      events: results.map(HistoryService.toHistoryEvent),
    };
  }

  static listHistoryPage(
    filter: HistoryFilter,
    beforeId: number | null,
    limit: number
  ): HistoryPage {
    const { clauses, params } = HistoryService.historyConditions(filter);
    const total = HistoryService.countEvents(HistoryService.toWhere(clauses, params));

    if (beforeId !== null) {
      clauses.push('id < ?');
      params.push(beforeId);
    }
    const where = HistoryService.toWhere(clauses, params);
    const rows = DbClient.requireSqliteInstance()
      .query<HistoryRow, (string | number)[]>(
        `SELECT ${HISTORY_COLUMNS} FROM events ${where.sql} ORDER BY id DESC LIMIT ?`
      )
      .all(...where.params, limit + 1);

    const events = HistoryService.withContext(
      rows.slice(0, limit).map(HistoryService.toHistoryEvent)
    );
    let nextBeforeId: number | null = null;
    const last = events.at(-1);
    if (rows.length > limit && last) {
      nextBeforeId = last.id;
    }
    return { events, total, nextBeforeId };
  }

  static readonly listEventsAfter = (afterId: number, limit: number): HistoryEntry[] => {
    const events = DbClient.requireSqliteInstance()
      .query<
        HistoryRow,
        [number, number]
      >(`SELECT ${HISTORY_COLUMNS} FROM events WHERE id > ? ORDER BY id LIMIT ?`)
      .all(afterId, limit)
      .map(HistoryService.toHistoryEvent);
    return HistoryService.withContext(events);
  };

  private static snapshotString(event: HistoryEvent, key: string): string | null {
    const value = event.snapshot?.[key];
    if (typeof value === 'string') {
      return value;
    }
    return null;
  }

  private static valuesById(sql: string, ids: readonly string[]): Map<string, string> {
    return new Map(
      BatchQueries.queryByIds<IdValueRow>(sql, ids).map((row) => {
        return [row.id, row.value];
      })
    );
  }

  private static ownerOf(event: HistoryEvent, commentTasks: Map<string, string>): string | null {
    switch (event.entityType) {
      case 'epic':
        return null;
      case 'task':
      case 'subtask':
        return event.entityId;
      case 'comment':
        return (
          HistoryService.snapshotString(event, 'task_id') ??
          commentTasks.get(event.entityId) ??
          null
        );
      case 'dependency':
        return HistoryService.snapshotString(event, 'task_id');
    }
  }

  private static linkedTasks(sql: string, ids: readonly string[]): Map<string, string[]> {
    const linked = new Map<string, string[]>();
    for (const row of BatchQueries.queryByIds<IdValueRow>(sql, ids)) {
      const values = linked.get(row.id) ?? [];
      values.push(row.value);
      linked.set(row.id, values);
    }
    return linked;
  }

  private static changeValues(event: HistoryEvent, key: string): unknown[] {
    const change = event.changes?.[key];
    if (!change) {
      return [];
    }
    return [change.from, change.to];
  }

  private static relatedIdsOf(
    event: HistoryEvent,
    owner: string | null,
    lookups: RelatedLookups
  ): string[] {
    const related: unknown[] = [owner];
    if (event.entityType === 'task' || event.entityType === 'subtask') {
      const link = lookups.links.get(event.entityId);
      related.push(
        link?.epic,
        link?.parent,
        HistoryService.snapshotString(event, 'epic_id'),
        HistoryService.snapshotString(event, 'parent_task_id'),
        ...HistoryService.changeValues(event, 'epic_id')
      );
      const dependents = lookups.dependents.get(event.entityId);
      if (dependents) {
        related.push(...dependents);
      }
      const children = lookups.children.get(event.entityId);
      if (children) {
        related.push(...children);
      }
    }
    if (event.entityType === 'dependency') {
      related.push(
        HistoryService.snapshotString(event, 'task_id'),
        HistoryService.snapshotString(event, 'depends_on_id')
      );
    }
    const ids = new Set<string>();
    for (const value of related) {
      if (typeof value === 'string' && value !== '' && value !== event.entityId) {
        ids.add(value);
      }
    }
    return [...ids];
  }

  private static relatedLookups(events: readonly HistoryEvent[]): RelatedLookups {
    const taskIds = BatchQueries.uniqueIds(
      events
        .filter((event) => {
          return event.entityType === 'task' || event.entityType === 'subtask';
        })
        .map((event) => {
          return event.entityId;
        })
    );
    const links = new Map(
      BatchQueries.queryByIds<TaskLinkRow>(
        `SELECT id, epic_id AS epic, parent_task_id AS parent FROM tasks WHERE id IN (${IDS_PARAM})`,
        taskIds
      ).map((row) => {
        return [row.id, row];
      })
    );
    const dependents = HistoryService.linkedTasks(
      `SELECT depends_on_id AS id, task_id AS value FROM dependencies WHERE depends_on_id IN (${IDS_PARAM})`,
      taskIds
    );
    const children = HistoryService.linkedTasks(
      `SELECT parent_task_id AS id, id AS value FROM tasks WHERE parent_task_id IN (${IDS_PARAM})`,
      taskIds
    );
    return { links, dependents, children };
  }

  private static withContext(events: readonly HistoryEvent[]): HistoryEntry[] {
    const unownedComments = events
      .filter((event) => {
        return event.entityType === 'comment' && event.snapshot === null;
      })
      .map((event) => {
        return event.entityId;
      });
    const commentTasks = HistoryService.valuesById(
      `SELECT id, task_id AS value FROM comments WHERE id IN (${IDS_PARAM})`,
      BatchQueries.uniqueIds(unownedComments)
    );
    const owners = events.map((event) => {
      return HistoryService.ownerOf(event, commentTasks);
    });
    const epicIds = events
      .filter((event) => {
        return event.entityType === 'epic';
      })
      .map((e) => {
        return e.entityId;
      });
    const epicTitles = HistoryService.valuesById(
      `SELECT id, title AS value FROM epics WHERE id IN (${IDS_PARAM})`,
      BatchQueries.uniqueIds(epicIds)
    );
    const taskTitles = HistoryService.valuesById(
      `SELECT id, title AS value FROM tasks WHERE id IN (${IDS_PARAM})`,
      BatchQueries.uniqueIds(owners)
    );

    const lookups = HistoryService.relatedLookups(events);

    return events.map((event, index) => {
      const taskId = owners[index] ?? null;
      let title: string | null = null;
      if (event.entityType === 'epic') {
        title = epicTitles.get(event.entityId) ?? HistoryService.snapshotString(event, 'title');
      } else if (taskId !== null) {
        title = taskTitles.get(taskId) ?? null;
      }
      if (title === null && (event.entityType === 'task' || event.entityType === 'subtask')) {
        title = HistoryService.snapshotString(event, 'title');
      }
      return {
        ...event,
        taskId,
        title,
        relatedIds: HistoryService.relatedIdsOf(event, taskId, lookups),
      };
    });
  }

  static readonly getLatestEventId = (): number => {
    const row = DbClient.requireSqliteInstance()
      .query<LatestIdRow, []>('SELECT MAX(id) AS latest FROM events')
      .get();
    return row?.latest ?? 0;
  };
}

export type HistoryEntityType = 'epic' | 'task' | 'subtask' | 'comment' | 'dependency';
export type HistoryAction = 'create' | 'update' | 'delete';

export const HISTORY_ENTITY_TYPES: readonly HistoryEntityType[] = [
  'epic',
  'task',
  'subtask',
  'comment',
  'dependency',
];
export const HISTORY_ACTIONS: readonly HistoryAction[] = ['create', 'update', 'delete'];

export interface HistoryFilter {
  entityId?: string;
  ownedBy?: string;
  types?: readonly HistoryEntityType[];
  actions?: readonly HistoryAction[];
  since?: Date;
  until?: Date;
}

interface HistoryOptions extends HistoryFilter {
  limit?: number;
  page?: number;
}

export interface HistoryEvent {
  id: number;
  action: HistoryAction;
  entityType: HistoryEntityType;
  entityId: string;
  snapshot: Record<string, unknown> | null;
  changes: Record<string, FieldChange> | null;
  timestamp: Date;
}

export interface HistoryEntry extends HistoryEvent {
  taskId: string | null;
  title: string | null;
  relatedIds: string[];
}

export interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  events: HistoryEvent[];
}

export interface HistoryPage {
  events: HistoryEntry[];
  total: number;
  nextBeforeId: number | null;
}

interface HistoryCountRow {
  total: number;
}

interface LatestIdRow {
  latest: number | null;
}

interface HistoryRow {
  id: number;
  action: HistoryAction;
  entity_type: HistoryEntityType;
  entity_id: string;
  snapshot: string | null;
  changes: string | null;
  created_at: number;
}

interface WhereClause {
  sql: string;
  params: (string | number)[];
}

interface ConditionList {
  clauses: string[];
  params: (string | number)[];
}

const HISTORY_COLUMNS = 'id, action, entity_type, entity_id, snapshot, changes, created_at';

const parseJsonRecord: (json: string) => Record<string, unknown> = JSON.parse;
const parseJsonChanges: (json: string) => Record<string, FieldChange> = JSON.parse;

interface IdValueRow {
  id: string;
  value: string;
}

interface TaskLinkRow {
  id: string;
  epic: string | null;
  parent: string | null;
}

interface RelatedLookups {
  links: Map<string, TaskLinkRow>;
  dependents: Map<string, string[]>;
  children: Map<string, string[]>;
}
