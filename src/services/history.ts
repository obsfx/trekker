import { requireSqliteInstance } from '../db/client';
import { PAGINATION_DEFAULTS } from '../types';

export type HistoryEntityType = 'epic' | 'task' | 'subtask' | 'comment' | 'dependency';
export type HistoryAction = 'create' | 'update' | 'delete';

interface HistoryOptions {
  entityId?: string;
  types?: HistoryEntityType[];
  actions?: HistoryAction[];
  since?: Date;
  until?: Date;
  limit?: number;
  page?: number;
}

export interface HistoryEvent {
  id: number;
  action: HistoryAction;
  entityType: HistoryEntityType;
  entityId: string;
  snapshot: Record<string, unknown> | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  timestamp: Date;
}

export interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  events: HistoryEvent[];
}

interface HistoryCountRow {
  total: number;
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

const parseJsonRecord: (json: string) => Record<string, unknown> = JSON.parse;
const parseJsonChanges: (json: string) => Record<string, { from: unknown; to: unknown }> =
  JSON.parse;

export function getHistory(options?: HistoryOptions): HistoryResponse {
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.HISTORY_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.entityId) {
    conditions.push('entity_id = ?');
    params.push(options.entityId);
  }

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => '?').join(', ');
    conditions.push(`entity_type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.actions && options.actions.length > 0) {
    const placeholders = options.actions.map(() => '?').join(', ');
    conditions.push(`action IN (${placeholders})`);
    params.push(...options.actions);
  }

  if (options?.since) {
    conditions.push('created_at >= ?');
    params.push(options.since.getTime());
  }

  if (options?.until) {
    conditions.push('created_at <= ?');
    params.push(options.until.getTime());
  }

  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  // Count total results
  const countQuery = `SELECT COUNT(*) as total FROM events ${whereClause}`;
  const countResult = sqlite.query<HistoryCountRow, (string | number)[]>(countQuery).get(...params);
  const total = countResult?.total ?? 0;

  // Get paginated results (newest first)
  const selectQuery = `
    SELECT id, action, entity_type, entity_id, snapshot, changes, created_at
    FROM events
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const results = sqlite
    .query<HistoryRow, (string | number)[]>(selectQuery)
    .all(...params, limit, offset);

  return {
    total,
    page,
    limit,
    events: results.map((row) => {
      let snapshot: Record<string, unknown> | null = null;
      if (row.snapshot) {
        snapshot = parseJsonRecord(row.snapshot);
      }

      let changes: Record<string, { from: unknown; to: unknown }> | null = null;
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
        timestamp: new Date(row.created_at),
      };
    }),
  };
}
