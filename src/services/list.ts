import { requireSqliteInstance } from '../db/client';
import { VALID_SORT_FIELDS, PAGINATION_DEFAULTS } from '../types';
import type { ListEntityType } from '../types';
import { MS_PER_SECOND } from '../utils/constants';

const VALID_SORT_FIELD_SET: ReadonlySet<string> = new Set(VALID_SORT_FIELDS);

export type { ListEntityType };

interface ListOptions {
  types?: ListEntityType[];
  statuses?: string[];
  priorities?: number[];
  since?: Date;
  until?: Date;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  page?: number;
}

export interface ListItem {
  type: ListEntityType;
  id: string;
  title: string;
  status: string;
  priority: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListResponse {
  total: number;
  page: number;
  limit: number;
  items: ListItem[];
}

interface ListCountRow {
  total: number;
}

interface ListRow {
  type: ListEntityType;
  id: string;
  title: string;
  status: string;
  priority: number;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
}

export function listAll(options?: ListOptions): ListResponse {
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  // Build filter conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => '?').join(', ');
    conditions.push(`type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.statuses && options.statuses.length > 0) {
    const placeholders = options.statuses.map(() => '?').join(', ');
    conditions.push(`status IN (${placeholders})`);
    params.push(...options.statuses);
  }

  if (options?.priorities && options.priorities.length > 0) {
    const placeholders = options.priorities.map(() => '?').join(', ');
    conditions.push(`priority IN (${placeholders})`);
    params.push(...options.priorities);
  }

  if (options?.since) {
    conditions.push('created_at >= ?');
    params.push(Math.floor(options.since.getTime() / MS_PER_SECOND));
  }

  if (options?.until) {
    conditions.push('created_at <= ?');
    params.push(Math.floor(options.until.getTime() / MS_PER_SECOND));
  }

  let whereClause = '';
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`;
  }

  // Build sort clause
  let orderClause = 'ORDER BY created_at DESC';
  if (options?.sort && options.sort.length > 0) {
    const sortParts = options.sort.map((s) => {
      let field = s.field;
      if (s.field === 'created') {
        field = 'created_at';
      } else if (s.field === 'updated') {
        field = 'updated_at';
      }
      return `${field} ${s.direction.toUpperCase()}`;
    });
    orderClause = `ORDER BY ${sortParts.join(', ')}`;
  }

  // Base query using UNION ALL
  const baseQuery = `
    SELECT 'epic' as type, id, title, status, priority, NULL as parent_id, created_at, updated_at FROM epics
    UNION ALL
    SELECT 'task' as type, id, title, status, priority, epic_id as parent_id, created_at, updated_at FROM tasks WHERE parent_task_id IS NULL
    UNION ALL
    SELECT 'subtask' as type, id, title, status, priority, parent_task_id as parent_id, created_at, updated_at FROM tasks WHERE parent_task_id IS NOT NULL
  `;

  // Count total results
  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) ${whereClause}`;
  const countResult = sqlite.query<ListCountRow, (string | number)[]>(countQuery).get(...params);
  const total = countResult?.total ?? 0;

  // Get paginated results
  const selectQuery = `
    SELECT * FROM (${baseQuery})
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const results = sqlite
    .query<ListRow, (string | number)[]>(selectQuery)
    .all(...params, limit, offset);

  return {
    total,
    page,
    limit,
    items: results.map((row) => ({
      type: row.type,
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      parentId: row.parent_id,
      createdAt: new Date(row.created_at * MS_PER_SECOND),
      updatedAt: new Date(row.updated_at * MS_PER_SECOND),
    })),
  };
}

export function parseSort(sortStr: string): { field: string; direction: 'asc' | 'desc' }[] {
  const parts = sortStr.split(',').map((s) => s.trim());
  const result: { field: string; direction: 'asc' | 'desc' }[] = [];

  for (const part of parts) {
    const [field, dir] = part.split(':').map((s) => s.trim().toLowerCase());

    if (!VALID_SORT_FIELD_SET.has(field)) {
      throw new Error(
        `Invalid sort field: ${field}. Valid fields: ${VALID_SORT_FIELDS.join(', ')}`
      );
    }

    if (dir === 'asc') {
      result.push({ field, direction: 'asc' });
    } else {
      result.push({ field, direction: 'desc' });
    }
  }

  return result;
}
