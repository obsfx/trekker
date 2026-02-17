import { getDb } from "../db/client";
import { idCounters } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { type EntityType, PREFIX_MAP } from "../types";
import { getCurrentDbName } from "./db-context";

export type { EntityType };

export function generateId(entityType: EntityType, overrideDbName?: string): string {
  const dbName = overrideDbName ?? getCurrentDbName();
  const db = getDb(dbName);
  const prefix = PREFIX_MAP[entityType];

  // Atomically increment the counter and return the new value
  db.update(idCounters)
    .set({ counter: sql`${idCounters.counter} + 1` })
    .where(eq(idCounters.entityType, entityType))
    .run();

  const result = db
    .select({ counter: idCounters.counter })
    .from(idCounters)
    .where(eq(idCounters.entityType, entityType))
    .get();

  if (!result) {
    throw new Error(`Counter not found for entity type: ${entityType}`);
  }

  return `${dbName.toUpperCase()}-${prefix}-${result.counter}`;
}

export function generateUuid(): string {
  return crypto.randomUUID();
}
