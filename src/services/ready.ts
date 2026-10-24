import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import { PAGINATION_DEFAULTS } from '@/src/types';
import type { PaginatedResponse } from '@/src/types';
import { MS_PER_SECOND } from '@/src/utils/constants';
import type { PageQuery } from '@/src/types';

export abstract class ReadyService {
  static getReadyTasks(options?: PageQuery): PaginatedResponse<ReadyTask> {
    const sqlite = DbClient.requireSqliteInstance();

    const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
    const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    const baseWhere = `
      WHERE t.status = 'todo'
        AND t.parent_task_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM dependencies d
          JOIN tasks dt ON dt.id = d.depends_on_id
          WHERE d.task_id = t.id
            AND dt.status NOT IN ('completed', 'wont_fix', 'archived')
        )
    `;

    // Count total ready tasks
    const countResult = sqlite
      .query<ReadyCountRow, []>(`SELECT COUNT(*) as total FROM tasks t ${baseWhere}`)
      .get();
    const total = countResult?.total ?? 0;

    // Find todo tasks (not subtasks) that have no incomplete dependencies
    const readyRows = sqlite
      .query<ReadyTaskRow, [number, number]>(
        `
        SELECT t.id, t.title, t.description, t.priority, t.status,
               t.epic_id, t.tags, t.created_at, t.updated_at
        FROM tasks t
        ${baseWhere}
        ORDER BY t.priority ASC, t.created_at ASC, t.rowid ASC
        LIMIT ? OFFSET ?
      `
      )
      .all(limit, offset);

    // For each ready task, find its downstream dependents
    const dependentsQuery = sqlite.query<ReadyTaskDependent, [string]>(
      `
      SELECT t.id, t.title, t.status, t.priority
      FROM dependencies d
      JOIN tasks t ON t.id = d.task_id
      WHERE d.depends_on_id = ?
      ORDER BY t.priority ASC
    `
    );

    const items: ReadyTask[] = readyRows.map((row) => {
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        epicId: row.epic_id,
        tags: row.tags,
        createdAt: dayjs(row.created_at * MS_PER_SECOND).toDate(),
        updatedAt: dayjs(row.updated_at * MS_PER_SECOND).toDate(),
        dependents: dependentsQuery.all(row.id).map((d) => {
          return {
            id: d.id,
            title: d.title,
            status: d.status,
            priority: d.priority,
          };
        }),
      };
    });

    return { total, page, limit, items };
  }
}

export interface ReadyTask {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  epicId: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
  dependents: ReadyTaskDependent[];
}

export interface ReadyTaskDependent {
  id: string;
  title: string;
  status: string;
  priority: number;
}

interface ReadyTaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  epic_id: string | null;
  tags: string | null;
  created_at: number;
  updated_at: number;
}

interface ReadyCountRow {
  total: number;
}
