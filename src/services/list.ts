import { getDb, requireSqliteInstance } from "../db/client-node";
import {
  VALID_SORT_FIELDS,
  PAGINATION_DEFAULTS,
  type ListEntityType,
} from "../types";

export type { ListEntityType };

function mapSortFieldToColumn(field: string): string {
  if (field === "created") return "created_at";
  if (field === "updated") return "updated_at";
  return field;
}

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

export async function listAll(options?: ListOptions): Promise<ListResponse> {
  // Initialize database first (async with sql.js)
  await getDb();
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.LIST_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

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

  // Build sort clause
  let orderClause = "ORDER BY created_at DESC";
  if (options?.sort && options.sort.length > 0) {
    const sortParts = options.sort.map((s) => {
      const column = mapSortFieldToColumn(s.field);
      return `${column} ${s.direction.toUpperCase()}`;
    });
    orderClause = `ORDER BY ${sortParts.join(", ")}`;
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
  const countSql = `SELECT COUNT(*) as total FROM (${baseQuery}) ${whereClause}`;
  const stmt1 = sqlite.prepare(countSql);
  stmt1.bind(params);
  let total = 0;
  if (stmt1.step()) {
    const row = stmt1.getAsObject();
    total = (row.total as number) ?? 0;
  }
  stmt1.free();

  // Get paginated results
  const selectSql = `
    SELECT * FROM (${baseQuery})
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const stmt2 = sqlite.prepare(selectSql);
  stmt2.bind([...params, limit, offset]);

  const results: Array<{
    type: string;
    id: string;
    title: string;
    status: string;
    priority: number;
    parent_id: string | null;
    created_at: number;
    updated_at: number;
  }> = [];

  while (stmt2.step()) {
    results.push(stmt2.getAsObject() as typeof results[0]);
  }
  stmt2.free();

  return {
    total,
    page,
    limit,
    items: results.map((row) => ({
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
