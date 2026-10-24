import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import { SqlConditions } from '@/src/services/sql-conditions';
import { VALID_SORT_FIELDS, PAGINATION_DEFAULTS } from '@/src/types';
import type { ListEntityType } from '@/src/types';
import { MS_PER_SECOND } from '@/src/utils/constants';
import type { SortClause } from '@/src/types';

export abstract class ListService {
  static listAll(options?: ListOptions): ListResponse {
    const sqlite = DbClient.requireSqliteInstance();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    const conditions = new SqlConditions()
      .anyOf('type', options?.types ?? [])
      .anyOf('status', options?.statuses ?? [])
      .anyOf('priority', options?.priorities ?? []);
    if (options?.since) {
      conditions.add('created_at >= ?', Math.floor(dayjs(options.since).valueOf() / MS_PER_SECOND));
    }
    if (options?.until) {
      conditions.add('created_at <= ?', Math.floor(dayjs(options.until).valueOf() / MS_PER_SECOND));
    }
    const whereClause = conditions.toSql();
    const params = conditions.params;

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
      items: results.map((row) => {
        return {
          type: row.type,
          id: row.id,
          title: row.title,
          status: row.status,
          priority: row.priority,
          parentId: row.parent_id,
          createdAt: dayjs(row.created_at * MS_PER_SECOND).toDate(),
          updatedAt: dayjs(row.updated_at * MS_PER_SECOND).toDate(),
        };
      }),
    };
  }

  static parseSort(sortStr: string): SortClause[] {
    const parts = sortStr.split(',').map((s) => {
      return s.trim();
    });
    const result: SortClause[] = [];

    for (const part of parts) {
      const [field, dir] = part.split(':').map((s) => {
        return s.trim().toLowerCase();
      });

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
}

const VALID_SORT_FIELD_SET: ReadonlySet<string> = new Set(VALID_SORT_FIELDS);

export type { ListEntityType };

interface ListOptions {
  types?: ListEntityType[];
  statuses?: string[];
  priorities?: number[];
  since?: Date;
  until?: Date;
  sort?: SortClause[];
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
