import dayjs from 'dayjs';
import { DbClient } from '@/src/db/client';
import type { ListEntityType, Priority, TaskStatus } from '@/src/types';
import { MS_PER_SECOND } from '@/src/utils/constants';
import { IDS_PARAM, BatchQueries } from '@/src/services/batch-query';
import { SqlConditions, type SqlValue } from '@/src/services/sql-conditions';

export abstract class ItemsService {
  private static includesKind(filter: ItemFilter, kind: ListEntityType): boolean {
    return filter.kinds.length === 0 || filter.kinds.includes(kind);
  }

  private static withDateRange(conditions: SqlConditions, range: DateRange): SqlConditions {
    let column = 'updated_at';
    if (range.field === 'created') {
      column = 'created_at';
    }
    if (range.from !== null) {
      conditions.add(`${column} >= ?`, Math.floor(range.from / MS_PER_SECOND));
    }
    if (range.to !== null) {
      conditions.add(`${column} < ?`, Math.ceil(range.to / MS_PER_SECOND));
    }
    return conditions;
  }

  private static withSharedFilters(conditions: SqlConditions, filter: ItemFilter): SqlConditions {
    conditions.anyOf('status', filter.statuses).anyOf('priority', filter.priorities);
    if (filter.ids.length > 0) {
      conditions.add(`id IN (${IDS_PARAM})`, JSON.stringify(filter.ids));
    }
    if (filter.dates) {
      ItemsService.withDateRange(conditions, filter.dates);
    }
    return conditions;
  }

  private static epicConditions(filter: ItemFilter): SqlConditions | null {
    if (
      !ItemsService.includesKind(filter, 'epic') ||
      filter.epicId !== null ||
      filter.parentId !== null
    ) {
      return null;
    }
    return ItemsService.withSharedFilters(new SqlConditions(), filter);
  }

  private static taskConditions(filter: ItemFilter): SqlConditions | null {
    const wantsTasks = ItemsService.includesKind(filter, 'task') && filter.parentId === null;
    const wantsSubtasks = ItemsService.includesKind(filter, 'subtask');
    if (!wantsTasks && !wantsSubtasks) {
      return null;
    }

    const conditions = new SqlConditions();
    if (!wantsSubtasks) {
      conditions.add('parent_task_id IS NULL');
    }
    if (!wantsTasks) {
      conditions.add('parent_task_id IS NOT NULL');
    }
    if (filter.parentId !== null) {
      conditions.add('parent_task_id = ?', filter.parentId);
    }
    if (filter.epicId !== null) {
      conditions.add('epic_id = ?', filter.epicId);
    }
    return ItemsService.withSharedFilters(conditions, filter);
  }

  private static keysetConditions(
    base: SqlConditions,
    sort: ItemSort,
    after: ItemKey | null
  ): SqlConditions {
    const conditions = base.copy();
    if (after === null) {
      return conditions;
    }
    let operator = '>';
    if (sort.direction === 'desc') {
      operator = '<';
    }
    return conditions.add(
      `(${SORT_COLUMNS[sort.field]}, id) ${operator} (?, ?)`,
      after.value,
      after.id
    );
  }

  private static pageQuery(
    epics: SqlConditions | null,
    tasks: SqlConditions | null,
    sort: ItemSort,
    after: ItemKey | null
  ): SqlFragment {
    const column = SORT_COLUMNS[sort.field];
    const arms: SqlFragment[] = [];
    if (epics) {
      const where = ItemsService.keysetConditions(epics, sort, after);
      arms.push({
        sql: `SELECT ${EPIC_COLUMNS}, ${column} AS sort_value FROM epics ${where.toSql()}`,
        params: where.params,
      });
    }
    if (tasks) {
      const where = ItemsService.keysetConditions(tasks, sort, after);
      arms.push({
        sql: `SELECT ${TASK_COLUMNS}, ${column} AS sort_value FROM tasks ${where.toSql()}`,
        params: where.params,
      });
    }
    const direction = sort.direction.toUpperCase();
    return {
      sql: `${arms
        .map((arm) => {
          return arm.sql;
        })
        .join(' UNION ALL ')}
        ORDER BY sort_value ${direction}, id ${direction} LIMIT ?`,
      params: arms.flatMap((arm) => {
        return arm.params;
      }),
    };
  }

  private static countRows(table: 'epics' | 'tasks', conditions: SqlConditions | null): number {
    if (!conditions) {
      return 0;
    }
    const row = DbClient.requireSqliteInstance()
      .query<TotalRow, SqlValue[]>(`SELECT COUNT(*) AS total FROM ${table} ${conditions.toSql()}`)
      .get(...conditions.params);
    return row?.total ?? 0;
  }

  static listItems(
    filter: ItemFilter,
    sort: ItemSort,
    after: ItemKey | null,
    limit: number
  ): ItemPage {
    const epics = ItemsService.epicConditions(filter);
    const tasks = ItemsService.taskConditions(filter);
    if (!epics && !tasks) {
      return { items: [], total: 0, nextKey: null };
    }

    const query = ItemsService.pageQuery(epics, tasks, sort, after);
    const rows = DbClient.requireSqliteInstance()
      .query<SortedItemRow, SqlValue[]>(query.sql)
      .all(...query.params, limit + 1);

    const pageRows = rows.slice(0, limit);
    let nextKey: ItemKey | null = null;
    const last = pageRows.at(-1);
    if (rows.length > limit && last) {
      nextKey = { value: last.sort_value, id: last.id };
    }

    return {
      items: ItemsService.enrich(pageRows),
      total: ItemsService.countRows('epics', epics) + ItemsService.countRows('tasks', tasks),
      nextKey,
    };
  }

  static getItemSummaries(ids: readonly string[]): ItemSummary[] {
    if (ids.length === 0) {
      return [];
    }
    const json = JSON.stringify(ids);
    const rows = DbClient.requireSqliteInstance()
      .query<ItemRow, [string, string]>(
        `SELECT ${EPIC_COLUMNS} FROM epics WHERE id IN (${IDS_PARAM})
         UNION ALL
         SELECT ${TASK_COLUMNS} FROM tasks WHERE id IN (${IDS_PARAM})`
      )
      .all(json, json);
    const byId = new Map(
      rows.map((row) => {
        return [row.id, row];
      })
    );
    return ItemsService.enrich(
      ids.flatMap((id) => {
        return byId.get(id) ?? [];
      })
    );
  }

  private static refsById(table: 'epics' | 'tasks', ids: readonly string[]): Map<string, ItemRef> {
    const rows = BatchQueries.queryByIds<ItemRef>(
      `SELECT id, title, status FROM ${table} WHERE id IN (${IDS_PARAM})`,
      ids
    );
    return new Map(
      rows.map((row) => {
        return [row.id, row];
      })
    );
  }

  private static countsById(sql: string, ids: readonly string[]): Map<string, ItemCount> {
    const rows = BatchQueries.queryByIds<CountRow>(sql, ids);
    return new Map(
      rows.map((row) => {
        return [row.id, { total: row.total, done: row.done }];
      })
    );
  }

  private static parseTags(tags: string | null): string[] {
    if (!tags) {
      return [];
    }
    return tags
      .split(',')
      .map((tag) => {
        return tag.trim();
      })
      .filter((tag) => {
        return tag.length > 0;
      });
  }

  private static refOf(refs: Map<string, ItemRef>, id: string | null): ItemRef | null {
    if (id === null) {
      return null;
    }
    return refs.get(id) ?? null;
  }

  private static enrich(rows: readonly ItemRow[]): ItemSummary[] {
    if (rows.length === 0) {
      return [];
    }
    const taskIds = rows
      .filter((row) => {
        return row.kind !== 'epic';
      })
      .map((row) => {
        return row.id;
      });
    const epicIds = rows
      .filter((row) => {
        return row.kind === 'epic';
      })
      .map((row) => {
        return row.id;
      });
    const epics = ItemsService.refsById(
      'epics',
      BatchQueries.uniqueIds(
        rows.map((row) => {
          return row.epic_id;
        })
      )
    );
    const parents = ItemsService.refsById(
      'tasks',
      BatchQueries.uniqueIds(
        rows.map((row) => {
          return row.parent_task_id;
        })
      )
    );
    const subtasks = ItemsService.countsById(SUBTASK_COUNTS_SQL, taskIds);
    const blockedBy = ItemsService.countsById(BLOCKED_BY_SQL, taskIds);
    const comments = ItemsService.countsById(COMMENT_COUNTS_SQL, taskIds);
    const progress = ItemsService.countsById(EPIC_PROGRESS_SQL, epicIds);

    return rows.map((row) => {
      let epicProgress: ItemCount | null = null;
      if (row.kind === 'epic') {
        epicProgress = progress.get(row.id) ?? NO_COUNT;
      }
      return {
        kind: row.kind,
        id: row.id,
        title: row.title,
        status: row.status,
        priority: row.priority,
        rank: row.rank,
        tags: ItemsService.parseTags(row.tags),
        epic: ItemsService.refOf(epics, row.epic_id),
        parent: ItemsService.refOf(parents, row.parent_task_id),
        subtasks: subtasks.get(row.id) ?? NO_COUNT,
        blockedBy: blockedBy.get(row.id)?.total ?? 0,
        progress: epicProgress,
        commentCount: comments.get(row.id)?.total ?? 0,
        createdAt: dayjs(row.created_at * MS_PER_SECOND).toDate(),
        updatedAt: dayjs(row.updated_at * MS_PER_SECOND).toDate(),
      };
    });
  }
}

export const ITEM_SORT_FIELDS = ['created', 'updated', 'priority', 'title', 'rank'] as const;
export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export const DATE_FIELDS = ['created', 'updated'] as const;

export type DateField = (typeof DATE_FIELDS)[number];

export interface DateRange {
  field: DateField;
  from: number | null;
  to: number | null;
}

export type ItemSortField = (typeof ITEM_SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface ItemSort {
  field: ItemSortField;
  direction: SortDirection;
}

export interface ItemKey {
  value: string | number;
  id: string;
}

export interface ItemFilter {
  kinds: readonly ListEntityType[];
  statuses: readonly TaskStatus[];
  priorities: readonly Priority[];
  epicId: string | null;
  parentId: string | null;
  ids: readonly string[];
  dates?: DateRange;
}

export interface ItemRef {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface ItemCount {
  total: number;
  done: number;
}

export interface ItemSummary {
  kind: ListEntityType;
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  rank: string | null;
  tags: string[];
  epic: ItemRef | null;
  parent: ItemRef | null;
  subtasks: ItemCount;
  blockedBy: number;
  progress: ItemCount | null;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemPage {
  items: ItemSummary[];
  total: number;
  nextKey: ItemKey | null;
}

interface ItemRow {
  kind: ListEntityType;
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  rank: string | null;
  epic_id: string | null;
  parent_task_id: string | null;
  tags: string | null;
  created_at: number;
  updated_at: number;
}

interface SortedItemRow extends ItemRow {
  sort_value: string | number;
}

interface CountRow {
  id: string;
  total: number;
  done: number;
}

interface TotalRow {
  total: number;
}

interface SqlFragment {
  sql: string;
  params: SqlValue[];
}

const SORT_COLUMNS: Record<ItemSortField, string> = {
  created: 'created_at',
  updated: 'updated_at',
  priority: 'priority',
  title: 'title',
  rank: "COALESCE(rank, '')",
};

const RESOLVED_STATUS_SQL = "('completed', 'wont_fix', 'archived')";

const EPIC_COLUMNS = `'epic' AS kind, id, title, status, priority, rank, NULL AS epic_id,
  NULL AS parent_task_id, NULL AS tags, created_at, updated_at`;

const TASK_COLUMNS = `IIF(parent_task_id IS NULL, 'task', 'subtask') AS kind, id, title, status,
  priority, rank, epic_id, parent_task_id, tags, created_at, updated_at`;

const SUBTASK_COUNTS_SQL = `
  SELECT parent_task_id AS id, COUNT(*) AS total, SUM(status IN ${RESOLVED_STATUS_SQL}) AS done
  FROM tasks WHERE parent_task_id IN (${IDS_PARAM}) GROUP BY parent_task_id`;

const EPIC_PROGRESS_SQL = `
  SELECT epic_id AS id, COUNT(*) AS total, SUM(status IN ${RESOLVED_STATUS_SQL}) AS done
  FROM tasks WHERE epic_id IN (${IDS_PARAM}) AND parent_task_id IS NULL GROUP BY epic_id`;

const BLOCKED_BY_SQL = `
  SELECT d.task_id AS id, COUNT(*) AS total, 0 AS done
  FROM dependencies d JOIN tasks t ON t.id = d.depends_on_id
  WHERE d.task_id IN (${IDS_PARAM}) AND t.status NOT IN ${RESOLVED_STATUS_SQL}
  GROUP BY d.task_id`;

const COMMENT_COUNTS_SQL = `
  SELECT task_id AS id, COUNT(*) AS total, 0 AS done
  FROM comments WHERE task_id IN (${IDS_PARAM}) GROUP BY task_id`;

const NO_COUNT: ItemCount = { total: 0, done: 0 };
