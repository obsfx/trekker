import { eq, sql } from "drizzle-orm";
import { getDb, idCounters } from "./db";
import { type EntityType, PREFIX_MAP } from "@trekker/shared";

export type { EntityType };

export function generateId(entityType: EntityType): string {
  const db = getDb();
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

  return `${prefix}-${result.counter}`;
}

export function generateUuid(): string {
  return crypto.randomUUID();
}
