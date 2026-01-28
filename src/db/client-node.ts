/**
 * Node.js SQLite client using sql.js (WebAssembly).
 *
 * Key differences from bun:sqlite:
 * - Async initialization (one-time WASM load)
 * - In-memory operation with explicit file persistence
 * - Save-after-write strategy for durability
 *
 * Uses drizzle-orm/sqlite-proxy to wrap sql.js.
 */
import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "fs";
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

// Module-level state
let sqlJsDb: SqlJsDatabase | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let currentDbPath: string | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize sql.js WASM runtime (one-time, cached).
 */
async function initSqlJsRuntime(): Promise<typeof SQL> {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

/**
 * Save the database to disk.
 * Called after every write operation.
 */
function saveDb(): void {
  if (!sqlJsDb || !currentDbPath) return;
  const data = sqlJsDb.export();
  writeFileSync(currentDbPath, Buffer.from(data));
}

/**
 * Create a Drizzle instance wrapping sql.js via sqlite-proxy.
 */
function createDrizzleInstance(sqlite: SqlJsDatabase): ReturnType<typeof drizzle> {
  return drizzle(
    // Query callback
    async (sql, params, method) => {
      try {
        // Handle different query methods
        if (method === "run") {
          sqlite.run(sql, params as unknown[]);
          saveDb();
          return { rows: [] };
        }

        if (method === "get") {
          const stmt = sqlite.prepare(sql);
          stmt.bind(params as unknown[]);
          if (stmt.step()) {
            // For 'get', return single row directly (not wrapped in array)
            const row = stmt.get();
            stmt.free();
            return { rows: row as unknown[] };
          }
          stmt.free();
          return { rows: [] };
        }

        // method === "all" or "values"
        const stmt = sqlite.prepare(sql);
        stmt.bind(params as unknown[]);
        const rows: unknown[][] = [];
        while (stmt.step()) {
          const row = stmt.get();
          if (row) rows.push(row as unknown[]);
        }
        stmt.free();
        return { rows };
      } catch (error) {
        console.error("SQL error:", error);
        throw error;
      }
    },
    // Batch callback (optional but improves performance)
    async (queries) => {
      const results: { rows: unknown[][] }[] = [];
      for (const query of queries) {
        const { sql, params, method } = query;
        try {
          if (method === "run") {
            sqlite.run(sql, params as unknown[]);
            results.push({ rows: [] });
            continue;
          }

          if (method === "get") {
            const stmt = sqlite.prepare(sql);
            stmt.bind(params as unknown[]);
            if (stmt.step()) {
              // For 'get', return single row directly (not wrapped in array)
              const row = stmt.get();
              stmt.free();
              results.push({ rows: row as unknown[] });
            } else {
              stmt.free();
              results.push({ rows: [] });
            }
            continue;
          }

          // method === "all" or "values"
          const stmt = sqlite.prepare(sql);
          stmt.bind(params as unknown[]);
          const rows: unknown[][] = [];
          while (stmt.step()) {
            const row = stmt.get();
            if (row) rows.push(row as unknown[]);
          }
          stmt.free();
          results.push({ rows });
        } catch (error) {
          console.error("Batch SQL error:", error);
          throw error;
        }
      }
      // Save once after all batch operations
      saveDb();
      return results;
    },
    { schema }
  );
}

/**
 * Get the Drizzle database instance (async).
 * Creates connection if not already connected.
 */
export async function getDb(cwd: string = process.cwd()): Promise<ReturnType<typeof drizzle>> {
  if (dbInstance && currentDbPath === getDbPath(cwd)) {
    return dbInstance;
  }

  // Close existing connection if switching directories
  if (dbInstance) {
    closeDb();
  }

  const dbPath = getDbPath(cwd);
  if (!existsSync(dbPath)) {
    throw new Error("Trekker not initialized. Run 'trekker init' first.");
  }

  await initSqlJsRuntime();

  // Load existing database
  const buffer = readFileSync(dbPath);
  sqlJsDb = new SQL!.Database(buffer);
  currentDbPath = dbPath;

  // Migrate existing databases if needed
  migrateHistoryTable(sqlJsDb);
  migrateEmbeddingsTable(sqlJsDb);

  dbInstance = createDrizzleInstance(sqlJsDb);
  return dbInstance;
}

/**
 * Create a new database (async).
 */
export async function createDb(cwd: string = process.cwd()): Promise<ReturnType<typeof drizzle>> {
  ensureTrekkerDir(cwd);
  const dbPath = getDbPath(cwd);

  await initSqlJsRuntime();

  // Create new in-memory database
  sqlJsDb = new SQL!.Database();
  currentDbPath = dbPath;

  // Create all tables
  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority INTEGER NOT NULL DEFAULT 2,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  sqlJsDb.run(`
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
    )
  `);

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    )
  `);

  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS id_counters (
      entity_type TEXT PRIMARY KEY,
      counter INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Initialize counters
  sqlJsDb.run("INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('task', 0)");
  sqlJsDb.run("INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('epic', 0)");
  sqlJsDb.run("INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('comment', 0)");

  // Events table for history/logbook
  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      snapshot TEXT,
      changes TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  sqlJsDb.run("CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id)");
  sqlJsDb.run("CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(entity_type, action)");
  sqlJsDb.run("CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)");

  // Embeddings table for vector storage
  sqlJsDb.run(`
    CREATE TABLE IF NOT EXISTS embeddings (
      entity_id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      vector BLOB NOT NULL
    )
  `);

  sqlJsDb.run("CREATE INDEX IF NOT EXISTS idx_embeddings_type ON embeddings(entity_type)");

  // Create history event triggers
  createHistoryTriggers(sqlJsDb);

  // Save to disk
  saveDb();

  dbInstance = createDrizzleInstance(sqlJsDb);
  return dbInstance;
}


function createHistoryTriggers(sqlite: SqlJsDatabase): void {
  // Epic triggers
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_insert AFTER INSERT ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('create', 'epic', NEW.id,
        json_object('id', NEW.id, 'title', NEW.title, 'description', NEW.description,
          'status', NEW.status, 'priority', NEW.priority),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_delete AFTER DELETE ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'epic', OLD.id,
        json_object('id', OLD.id, 'title', OLD.title, 'description', OLD.description,
          'status', OLD.status, 'priority', OLD.priority),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_update AFTER UPDATE ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', 'epic', NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        unixepoch() * 1000
      FROM (
        SELECT
          json_object('title', OLD.title, 'description', OLD.description, 'status', OLD.status, 'priority', OLD.priority) as old_json,
          json_object('title', NEW.title, 'description', NEW.description, 'status', NEW.status, 'priority', NEW.priority) as new_json
      ), json_each(json_object('title', 1, 'description', 1, 'status', 1, 'priority', 1))
      WHERE json_extract(old_json, '$.' || key) IS NOT json_extract(new_json, '$.' || key);
    END
  `);

  // Task triggers (handles both tasks and subtasks)
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_history_insert AFTER INSERT ON tasks BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('create', IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'), NEW.id,
        json_object('id', NEW.id, 'title', NEW.title, 'description', NEW.description,
          'status', NEW.status, 'priority', NEW.priority, 'epic_id', NEW.epic_id,
          'parent_task_id', NEW.parent_task_id, 'tags', NEW.tags),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_history_delete AFTER DELETE ON tasks BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', IIF(OLD.parent_task_id IS NULL, 'task', 'subtask'), OLD.id,
        json_object('id', OLD.id, 'title', OLD.title, 'description', OLD.description,
          'status', OLD.status, 'priority', OLD.priority, 'epic_id', OLD.epic_id,
          'parent_task_id', OLD.parent_task_id, 'tags', OLD.tags),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_history_update AFTER UPDATE ON tasks BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'), NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        unixepoch() * 1000
      FROM (
        SELECT
          json_object('title', OLD.title, 'description', OLD.description, 'status', OLD.status,
            'priority', OLD.priority, 'epic_id', OLD.epic_id, 'tags', OLD.tags) as old_json,
          json_object('title', NEW.title, 'description', NEW.description, 'status', NEW.status,
            'priority', NEW.priority, 'epic_id', NEW.epic_id, 'tags', NEW.tags) as new_json
      ), json_each(json_object('title', 1, 'description', 1, 'status', 1, 'priority', 1, 'epic_id', 1, 'tags', 1))
      WHERE json_extract(old_json, '$.' || key) IS NOT json_extract(new_json, '$.' || key);
    END
  `);

  // Comment triggers
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_history_insert AFTER INSERT ON comments BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('create', 'comment', NEW.id,
        json_object('id', NEW.id, 'task_id', NEW.task_id, 'author', NEW.author, 'content', NEW.content),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_history_delete AFTER DELETE ON comments BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'comment', OLD.id,
        json_object('id', OLD.id, 'task_id', OLD.task_id, 'author', OLD.author, 'content', OLD.content),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_history_update AFTER UPDATE ON comments BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', 'comment', NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        unixepoch() * 1000
      FROM (
        SELECT
          json_object('content', OLD.content) as old_json,
          json_object('content', NEW.content) as new_json
      ), json_each(json_object('content', 1))
      WHERE json_extract(old_json, '$.' || key) IS NOT json_extract(new_json, '$.' || key);
    END
  `);

  // Dependency triggers (no updates, only create/delete)
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS deps_history_insert AFTER INSERT ON dependencies BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('create', 'dependency', NEW.id,
        json_object('id', NEW.id, 'task_id', NEW.task_id, 'depends_on_id', NEW.depends_on_id),
        unixepoch() * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS deps_history_delete AFTER DELETE ON dependencies BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'dependency', OLD.id,
        json_object('id', OLD.id, 'task_id', OLD.task_id, 'depends_on_id', OLD.depends_on_id),
        unixepoch() * 1000);
    END
  `);
}

function migrateHistoryTable(sqlite: SqlJsDatabase): void {
  const result = sqlite.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='events'"
  );

  if (result.length === 0 || result[0].values.length === 0) {
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        snapshot TEXT,
        changes TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    sqlite.run("CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id)");
    sqlite.run("CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(entity_type, action)");
    sqlite.run("CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)");

    createHistoryTriggers(sqlite);
    saveDb();
  }
}

function migrateEmbeddingsTable(sqlite: SqlJsDatabase): void {
  const result = sqlite.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='embeddings'"
  );

  if (result.length === 0 || result[0].values.length === 0) {
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        entity_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        vector BLOB NOT NULL
      )
    `);

    sqlite.run("CREATE INDEX IF NOT EXISTS idx_embeddings_type ON embeddings(entity_type)");
    saveDb();
  }
}

/**
 * Get the raw sql.js database instance for direct SQL operations.
 */
export function getSqliteInstance(): SqlJsDatabase | null {
  return sqlJsDb;
}

export function requireSqliteInstance(): SqlJsDatabase {
  if (!sqlJsDb) {
    throw new Error("Database not initialized");
  }
  return sqlJsDb;
}

/**
 * Run raw SQL and save (for vector operations).
 */
export function runSql(sql: string, params?: unknown[]): void {
  if (!sqlJsDb) {
    throw new Error("Database not initialized");
  }
  sqlJsDb.run(sql, params);
  saveDb();
}

/**
 * Query raw SQL (for vector operations).
 */
export function querySql<T = unknown>(sql: string, params?: unknown[]): T[] {
  if (!sqlJsDb) {
    throw new Error("Database not initialized");
  }
  const stmt = sqlJsDb.prepare(sql);
  if (params) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function closeDb(): void {
  if (sqlJsDb) {
    sqlJsDb.close();
    sqlJsDb = null;
    dbInstance = null;
    currentDbPath = null;
  }
}

export function deleteDb(cwd: string = process.cwd()): void {
  closeDb();
  const trekkerDir = getTrekkerDir(cwd);
  if (existsSync(trekkerDir)) {
    rmSync(trekkerDir, { recursive: true, force: true });
  }
}

/**
 * Reset all DB state. Used for testing to allow switching between directories.
 */
export function resetDbState(): void {
  closeDb();
}
