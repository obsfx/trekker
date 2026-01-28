import { getDb, requireSqliteInstance } from "../db/client-node";
import { PAGINATION_DEFAULTS } from "../types";

export type HistoryEntityType = "epic" | "task" | "subtask" | "comment" | "dependency";
export type HistoryAction = "create" | "update" | "delete";

export interface HistoryOptions {
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

export async function getHistory(options?: HistoryOptions): Promise<HistoryResponse> {
  // Initialize database first (async with sql.js)
  await getDb();
  const sqlite = requireSqliteInstance();

  const limit = options?.limit ?? PAGINATION_DEFAULTS.HISTORY_PAGE_SIZE;
  const page = options?.page ?? PAGINATION_DEFAULTS.DEFAULT_PAGE;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.entityId) {
    conditions.push("entity_id = ?");
    params.push(options.entityId);
  }

  if (options?.types && options.types.length > 0) {
    const placeholders = options.types.map(() => "?").join(", ");
    conditions.push(`entity_type IN (${placeholders})`);
    params.push(...options.types);
  }

  if (options?.actions && options.actions.length > 0) {
    const placeholders = options.actions.map(() => "?").join(", ");
    conditions.push(`action IN (${placeholders})`);
    params.push(...options.actions);
  }

  if (options?.since) {
    conditions.push("created_at >= ?");
    params.push(options.since.getTime());
  }

  if (options?.until) {
    conditions.push("created_at <= ?");
    params.push(options.until.getTime());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total results
  const countSql = `SELECT COUNT(*) as total FROM events ${whereClause}`;
  const stmt1 = sqlite.prepare(countSql);
  stmt1.bind(params);
  let total = 0;
  if (stmt1.step()) {
    const row = stmt1.getAsObject();
    total = (row.total as number) ?? 0;
  }
  stmt1.free();

  // Get paginated results (newest first)
  const selectSql = `
    SELECT id, action, entity_type, entity_id, snapshot, changes, created_at
    FROM events
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const stmt2 = sqlite.prepare(selectSql);
  stmt2.bind([...params, limit, offset]);

  const results: Array<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: string;
    snapshot: string | null;
    changes: string | null;
    created_at: number;
  }> = [];

  while (stmt2.step()) {
    results.push(stmt2.getAsObject() as typeof results[0]);
  }
  stmt2.free();

  return {
    total,
    page,
    limit,
    events: results.map((row) => ({
      id: row.id,
      action: row.action as HistoryAction,
      entityType: row.entity_type as HistoryEntityType,
      entityId: row.entity_id,
      snapshot: row.snapshot ? JSON.parse(row.snapshot) : null,
      changes: row.changes ? JSON.parse(row.changes) : null,
      timestamp: new Date(row.created_at),
    })),
  };
}
