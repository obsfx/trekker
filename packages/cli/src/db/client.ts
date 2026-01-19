import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const TREKKER_DIR = ".trekker";
const DB_NAME = "trekker.db";

export function getTrekkerDir(cwd: string = process.cwd()): string {
  return join(cwd, TREKKER_DIR);
}

export function getDbPath(cwd: string = process.cwd()): string {
  return join(getTrekkerDir(cwd), DB_NAME);
}

export function isTrekkerInitialized(cwd: string = process.cwd()): boolean {
  return existsSync(getDbPath(cwd));
}

export function ensureTrekkerDir(cwd: string = process.cwd()): void {
  const trekkerDir = getTrekkerDir(cwd);
  if (!existsSync(trekkerDir)) {
    mkdirSync(trekkerDir, { recursive: true });
  }
}

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteInstance: Database | null = null;

export function getDb(cwd: string = process.cwd()) {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDbPath(cwd);
  if (!existsSync(dbPath)) {
    throw new Error(
      "Trekker not initialized. Run 'trekker init' first."
    );
  }

  sqliteInstance = new Database(dbPath);
  dbInstance = drizzle(sqliteInstance, { schema });
  return dbInstance;
}

export function createDb(cwd: string = process.cwd()) {
  ensureTrekkerDir(cwd);
  const dbPath = getDbPath(cwd);

  sqliteInstance = new Database(dbPath);
  dbInstance = drizzle(sqliteInstance, { schema });

  // Create tables
  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority INTEGER NOT NULL DEFAULT 2,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      epic_id TEXT REFERENCES epics(id) ON DELETE SET NULL,
      parent_task_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'todo',
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS id_counters (
      entity_type TEXT PRIMARY KEY,
      counter INTEGER NOT NULL DEFAULT 0
    );

    -- Initialize counters
    INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('task', 0);
    INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('epic', 0);
    INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('comment', 0);
  `);

  return dbInstance;
}

export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
  }
}

export function deleteDb(cwd: string = process.cwd()): void {
  closeDb();
  const trekkerDir = getTrekkerDir(cwd);
  if (existsSync(trekkerDir)) {
    rmSync(trekkerDir, { recursive: true, force: true });
  }
}
