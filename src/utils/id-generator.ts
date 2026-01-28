import { requireSqliteInstance, runSql, querySql } from "../db/client-node";
import { type EntityType, PREFIX_MAP } from "../types";

export type { EntityType };

export function generateId(entityType: EntityType): string {
  const prefix = PREFIX_MAP[entityType];

  // Atomically increment the counter using raw SQL
  runSql(
    "UPDATE id_counters SET counter = counter + 1 WHERE entity_type = ?",
    [entityType]
  );

  const result = querySql<{ counter: number }>(
    "SELECT counter FROM id_counters WHERE entity_type = ?",
    [entityType]
  );

  if (result.length === 0) {
    throw new Error(`Counter not found for entity type: ${entityType}`);
  }

  return `${prefix}-${result[0].counter}`;
}

export function generateUuid(): string {
  return crypto.randomUUID();
}
