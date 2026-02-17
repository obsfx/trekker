import { requireSqliteInstance, getAllDbNames } from "../db/client";
import { getCurrentDbName, isDbExplicitlySet } from "../utils/db-context";
import {
  VALID_SORT_FIELDS,
  PAGINATION_DEFAULTS,
  type ListEntityType,
} from "../types";

export type { ListEntityType };

export interface ListOptions {
  types?: ListEntityType[];
  statuses?: string[];
  priorities?: number[];
  since?: Date;
  until?: Date;
  sort?: { field: string; direction: "asc" | "desc" }[];
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

function queryDbForList(dbName: string, options?: ListOptions): {
  items: Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    priority: number;
    parent_id: string | null;
    created_at: number;
    updated_at: number;
  }>;
} {
  const sqlite = requireSqliteInstance(dbName);

  // Build filter conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => "?").join(", ");
    conditions.push(`type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.statuses && options.statuses.length > 0) {
    const placeholders = options.statuses.map(() => "?").join(", ");
    conditions.push(`status IN (${placeholders})`);
    params.push(...options.statuses);
  }

  if (options?.priorities && options.priorities.length > 0) {
    const placeholders = options.priorities.map(() => "?").join(", ");
    conditions.push(`priority IN (${placeholders})`);
    params.push(...options.priorities);
  }

  if (options?.since) {
    conditions.push("created_at >= ?");
    params.push(Math.floor(options.since.getTime() / 1000));
  }

  if (options?.until) {
    conditions.push("created_at <= ?");
    params.push(Math.floor(options.until.getTime() / 1000));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Base query using UNION ALL
  const baseQuery = `
    SELECT 'epic' as type, id, title, status, priority, NULL as parent_id, created_at, updated_at FROM epics
    UNION ALL
    SELECT 'task' as type, id, title, status, priority, epic_id as parent_id, created_at, updated_at FROM tasks WHERE parent_task_id IS NULL
    UNION ALL
    SELECT 'subtask' as type, id, title, status, priority, parent_task_id as parent_id, created_at, updated_at FROM tasks WHERE parent_task_id IS NOT NULL
  `;

  const selectQuery = `SELECT * FROM (${baseQuery}) ${whereClause}`;
  const items = sqlite.query(selectQuery).all(...params) as Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    priority: number;
    parent_id: string | null;
    created_at: number;
    updated_at: number;
  }>;

  return { items };
}

export function listAll(options?: ListOptions): ListResponse {
  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  // Collect items from one or all DBs
  let allItems: Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    priority: number;
    parent_id: string | null;
    created_at: number;
    updated_at: number;
  }> = [];

  if (isDbExplicitlySet()) {
    const result = queryDbForList(getCurrentDbName(), options);
    allItems = result.items;
  } else {
    const allDbNames = getAllDbNames();
    for (const dbName of allDbNames) {
      const result = queryDbForList(dbName, options);
      allItems.push(...result.items);
    }
  }

  // Sort merged results
  const sortFields = options?.sort ?? [{ field: "created", direction: "desc" as const }];
  allItems.sort((a, b) => {
    for (const s of sortFields) {
      const field = s.field === "created" ? "created_at" : s.field === "updated" ? "updated_at" : s.field;
      const aVal = (a as Record<string, unknown>)[field];
      const bVal = (b as Record<string, unknown>)[field];
      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      }
      if (cmp !== 0) {
        return s.direction === "asc" ? cmp : -cmp;
      }
    }
    return 0;
  });

  const total = allItems.length;

  // Paginate
  const pageItems = allItems.slice(offset, offset + limit);

  return {
    total,
    page,
    limit,
    items: pageItems.map((row) => ({
      type: row.type as ListEntityType,
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      parentId: row.parent_id,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000),
    })),
  };
}

export function parseSort(sortStr: string): { field: string; direction: "asc" | "desc" }[] {
  const parts = sortStr.split(",").map((s) => s.trim());
  const result: { field: string; direction: "asc" | "desc" }[] = [];

  for (const part of parts) {
    const [field, dir] = part.split(":").map((s) => s.trim().toLowerCase());

    if (!(VALID_SORT_FIELDS as readonly string[]).includes(field)) {
      throw new Error(`Invalid sort field: ${field}. Valid fields: ${VALID_SORT_FIELDS.join(", ")}`);
    }

    const direction = dir === "asc" ? "asc" : "desc";
    result.push({ field, direction });
  }

  return result;
}
