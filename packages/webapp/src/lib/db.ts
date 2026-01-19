import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  projects,
  epics,
  tasks,
  comments,
  dependencies,
  idCounters,
} from "@trekker/shared";

// Re-export schema from shared
export { projects, epics, tasks, comments, dependencies, idCounters };

const schema = { projects, epics, tasks, comments, dependencies, idCounters };

// Infer types from schema
export type Project = typeof projects.$inferSelect;
export type Epic = typeof epics.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Dependency = typeof dependencies.$inferSelect;
export type IdCounter = typeof idCounters.$inferSelect;

let sqliteInstance: Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (db) return db;

  const dbPath = process.env.TREKKER_DB_PATH;
  if (!dbPath) {
    throw new Error("TREKKER_DB_PATH environment variable not set");
  }

  sqliteInstance = new Database(dbPath);
  db = drizzle(sqliteInstance, { schema });
  return db;
}
