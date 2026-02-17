import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { existsSync, mkdirSync, rmSync, readdirSync } from "fs";
import { join } from "path";
import { getCurrentDbName } from "../utils/db-context";

const TREKKER_DIR = ".trekker";

interface DbInstance {
  drizzle: ReturnType<typeof drizzle<typeof schema>>;
  sqlite: Database;
}

const dbInstances = new Map<string, DbInstance>();

export function getTrekkerDir(cwd: string = process.cwd()): string {
  return join(cwd, TREKKER_DIR);
}

export function getDbPath(dbName: string = getCurrentDbName(), cwd: string = process.cwd()): string {
  return join(getTrekkerDir(cwd), `${dbName}.db`);
}

export function isTrekkerInitialized(cwd: string = process.cwd()): boolean {
  const trekkerDir = getTrekkerDir(cwd);
  if (!existsSync(trekkerDir)) return false;
  const dbFiles = readdirSync(trekkerDir).filter((f) => f.endsWith(".db"));
  return dbFiles.length > 0;
}

export function isDbInitialized(dbName: string, cwd: string = process.cwd()): boolean {
  return existsSync(getDbPath(dbName, cwd));
}

export function ensureTrekkerDir(cwd: string = process.cwd()): void {
  const trekkerDir = getTrekkerDir(cwd);
  if (!existsSync(trekkerDir)) {
    mkdirSync(trekkerDir, { recursive: true });
  }
}

export function getAllDbNames(cwd: string = process.cwd()): string[] {
  const trekkerDir = getTrekkerDir(cwd);
  if (!existsSync(trekkerDir)) return [];
  return readdirSync(trekkerDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => f.replace(/\.db$/, ""));
}

/**
 * Parse DB name from an entity ID.
 * Format: DBNAME-PREFIX-N where PREFIX is TREK|EPIC|CMT
 *
 * Examples:
 *   TREKKER-TREK-1 → "trekker"
 *   AGENT2-EPIC-3 → "agent2"
 *   MY-AGENT-TREK-1 → "my-agent"
 */
export function parseDbFromId(entityId: string): string {
  const parts = entityId.split("-");
  // Last part is the counter number
  // Second-to-last is the entity prefix (TREK, EPIC, CMT)
  // Everything before is the DB name
  if (parts.length < 3) {
    throw new Error(`Invalid entity ID format: ${entityId}`);
  }

  const entityPrefix = parts[parts.length - 2];
  if (!["TREK", "EPIC", "CMT"].includes(entityPrefix)) {
    throw new Error(`Invalid entity ID format: ${entityId}. Expected TREK, EPIC, or CMT prefix.`);
  }

  const dbNameParts = parts.slice(0, parts.length - 2);
  return dbNameParts.join("-").toLowerCase();
}

/**
 * Get a drizzle DB instance for a specific named DB, opening lazily.
 */
export function getDb(dbName: string = getCurrentDbName(), cwd: string = process.cwd()) {
  const key = `${cwd}:${dbName}`;
  const cached = dbInstances.get(key);
  if (cached) {
    return cached.drizzle;
  }

  const dbPath = getDbPath(dbName, cwd);
  if (!existsSync(dbPath)) {
    throw new Error(
      `Database '${dbName}' not initialized. Run 'trekker init${dbName !== "trekker" ? ` db:${dbName}` : ""}' first.`
    );
  }

  const sqlite = new Database(dbPath);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const drizzleInstance = drizzle(sqlite, { schema });

  // Migrate existing databases
  migrateSearchIndex(sqlite);
  migrateHistoryTable(sqlite);

  dbInstances.set(key, { drizzle: drizzleInstance, sqlite });
  return drizzleInstance;
}

/**
 * Get drizzle DB instance for a given entity ID by parsing the DB name from the ID prefix.
 */
export function getDbForEntity(entityId: string, cwd: string = process.cwd()) {
  const dbName = parseDbFromId(entityId);
  return getDb(dbName, cwd);
}

export function createDb(dbName: string = getCurrentDbName(), cwd: string = process.cwd()) {
  ensureTrekkerDir(cwd);
  const dbPath = getDbPath(dbName, cwd);

  const sqlite = new Database(dbPath);
  sqlite.exec("PRAGMA foreign_keys = ON");
  const drizzleInstance = drizzle(sqlite, { schema });

  // Create tables
  sqlite.exec(`
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
      depends_on_id TEXT NOT NULL,
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

    -- Events table for history/logbook
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      snapshot TEXT,
      changes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id);
    CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(entity_type, action);
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  `);

  // Create FTS5 search index and triggers
  createSearchIndex(sqlite);

  // Create history event triggers
  createHistoryTriggers(sqlite);

  const key = `${cwd}:${dbName}`;
  dbInstances.set(key, { drizzle: drizzleInstance, sqlite });

  return drizzleInstance;
}

function createSearchIndex(sqlite: Database): void {
  // Create FTS5 virtual table for full-text search
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      entity_id,
      entity_type,
      title,
      content,
      author,
      status UNINDEXED,
      parent_id UNINDEXED,
      tokenize='porter unicode61'
    )
  `);

  // Triggers for epics
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_search_insert AFTER INSERT ON epics BEGIN
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (NEW.id, 'epic', NEW.title, NEW.description, '', NEW.status, NULL);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_search_delete AFTER DELETE ON epics BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type = 'epic';
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_search_update AFTER UPDATE ON epics BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type = 'epic';
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (NEW.id, 'epic', NEW.title, NEW.description, '', NEW.status, NULL);
    END
  `);

  // Triggers for tasks (handles both tasks and subtasks)
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_search_insert AFTER INSERT ON tasks BEGIN
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (
        NEW.id,
        IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'),
        NEW.title,
        NEW.description,
        '',
        NEW.status,
        COALESCE(NEW.parent_task_id, NEW.epic_id)
      );
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_search_delete AFTER DELETE ON tasks BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type IN ('task', 'subtask');
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_search_update AFTER UPDATE ON tasks BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type IN ('task', 'subtask');
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (
        NEW.id,
        IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'),
        NEW.title,
        NEW.description,
        '',
        NEW.status,
        COALESCE(NEW.parent_task_id, NEW.epic_id)
      );
    END
  `);

  // Triggers for comments
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_search_insert AFTER INSERT ON comments BEGIN
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (NEW.id, 'comment', '', NEW.content, NEW.author, '', NEW.task_id);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_search_delete AFTER DELETE ON comments BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type = 'comment';
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_search_update AFTER UPDATE ON comments BEGIN
      DELETE FROM search_index WHERE entity_id = OLD.id AND entity_type = 'comment';
      INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
      VALUES (NEW.id, 'comment', '', NEW.content, NEW.author, '', NEW.task_id);
    END
  `);
}

function migrateSearchIndex(sqlite: Database): void {
  // Check if search_index exists
  const tableExists = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='search_index'")
    .get();

  if (!tableExists) {
    // Create the search index and triggers
    createSearchIndex(sqlite);

    // Populate from existing data
    populateSearchIndex(sqlite);
  }
}

function populateSearchIndex(sqlite: Database): void {
  // Index existing epics
  sqlite.run(`
    INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
    SELECT id, 'epic', title, description, '', status, NULL FROM epics
  `);

  // Index existing tasks (non-subtasks)
  sqlite.run(`
    INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
    SELECT id, 'task', title, description, '', status, epic_id FROM tasks WHERE parent_task_id IS NULL
  `);

  // Index existing subtasks
  sqlite.run(`
    INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
    SELECT id, 'subtask', title, description, '', status, parent_task_id FROM tasks WHERE parent_task_id IS NOT NULL
  `);

  // Index existing comments
  sqlite.run(`
    INSERT INTO search_index(entity_id, entity_type, title, content, author, status, parent_id)
    SELECT id, 'comment', '', content, author, '', task_id FROM comments
  `);
}

function createHistoryTriggers(sqlite: Database): void {
  // Drop existing triggers first so they get recreated with updated SQL
  sqlite.run("DROP TRIGGER IF EXISTS epics_history_insert");
  sqlite.run("DROP TRIGGER IF EXISTS epics_history_delete");
  sqlite.run("DROP TRIGGER IF EXISTS epics_history_update");
  sqlite.run("DROP TRIGGER IF EXISTS tasks_history_insert");
  sqlite.run("DROP TRIGGER IF EXISTS tasks_history_delete");
  sqlite.run("DROP TRIGGER IF EXISTS tasks_history_update");
  sqlite.run("DROP TRIGGER IF EXISTS comments_history_insert");
  sqlite.run("DROP TRIGGER IF EXISTS comments_history_delete");
  sqlite.run("DROP TRIGGER IF EXISTS comments_history_update");
  sqlite.run("DROP TRIGGER IF EXISTS deps_history_insert");
  sqlite.run("DROP TRIGGER IF EXISTS deps_history_delete");

  // Epic triggers
  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_insert AFTER INSERT ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('create', 'epic', NEW.id,
        json_object('id', NEW.id, 'title', NEW.title, 'description', NEW.description,
          'status', NEW.status, 'priority', NEW.priority),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_delete AFTER DELETE ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'epic', OLD.id,
        json_object('id', OLD.id, 'title', OLD.title, 'description', OLD.description,
          'status', OLD.status, 'priority', OLD.priority),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS epics_history_update AFTER UPDATE ON epics BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', 'epic', NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000
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
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_history_delete AFTER DELETE ON tasks BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', IIF(OLD.parent_task_id IS NULL, 'task', 'subtask'), OLD.id,
        json_object('id', OLD.id, 'title', OLD.title, 'description', OLD.description,
          'status', OLD.status, 'priority', OLD.priority, 'epic_id', OLD.epic_id,
          'parent_task_id', OLD.parent_task_id, 'tags', OLD.tags),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS tasks_history_update AFTER UPDATE ON tasks BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'), NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000
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
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_history_delete AFTER DELETE ON comments BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'comment', OLD.id,
        json_object('id', OLD.id, 'task_id', OLD.task_id, 'author', OLD.author, 'content', OLD.content),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS comments_history_update AFTER UPDATE ON comments BEGIN
      INSERT INTO events(action, entity_type, entity_id, changes, created_at)
      SELECT 'update', 'comment', NEW.id,
        json_group_object(key, json_object('from', json_extract(old_json, '$.' || key), 'to', json_extract(new_json, '$.' || key))),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000
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
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);

  sqlite.run(`
    CREATE TRIGGER IF NOT EXISTS deps_history_delete AFTER DELETE ON dependencies BEGIN
      INSERT INTO events(action, entity_type, entity_id, snapshot, created_at)
      VALUES ('delete', 'dependency', OLD.id,
        json_object('id', OLD.id, 'task_id', OLD.task_id, 'depends_on_id', OLD.depends_on_id),
        CAST(strftime('%s', 'now') AS INTEGER) * 1000);
    END
  `);
}

function migrateHistoryTable(sqlite: Database): void {
  // Check if events table exists
  const tableExists = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    .get();

  if (!tableExists) {
    // Create the events table
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

    // Create the triggers
    createHistoryTriggers(sqlite);
  }
}

export function rebuildSearchIndex(dbName?: string): void {
  const name = dbName ?? getCurrentDbName();
  getDb(name);
  const sqlite = getSqliteInstance(name);
  if (!sqlite) {
    throw new Error("Database not initialized");
  }

  // Clear and repopulate the search index
  sqlite.run("DELETE FROM search_index");
  populateSearchIndex(sqlite);
}

export function getSqliteInstance(dbName?: string, cwd: string = process.cwd()): Database | null {
  const name = dbName ?? getCurrentDbName();
  const key = `${cwd}:${name}`;
  return dbInstances.get(key)?.sqlite ?? null;
}

export function requireSqliteInstance(dbName?: string, cwd: string = process.cwd()): Database {
  const name = dbName ?? getCurrentDbName();
  getDb(name, cwd);
  const sqlite = getSqliteInstance(name, cwd);
  if (!sqlite) {
    throw new Error("Database not initialized");
  }
  return sqlite;
}

export function closeDb(): void {
  for (const [key, instance] of dbInstances) {
    instance.sqlite.close();
    dbInstances.delete(key);
  }
}

export function deleteDb(cwd: string = process.cwd()): void {
  closeDb();
  const trekkerDir = getTrekkerDir(cwd);
  if (existsSync(trekkerDir)) {
    rmSync(trekkerDir, { recursive: true, force: true });
  }
}

export function deleteNamedDb(dbName: string, cwd: string = process.cwd()): void {
  const key = `${cwd}:${dbName}`;
  const instance = dbInstances.get(key);
  if (instance) {
    instance.sqlite.close();
    dbInstances.delete(key);
  }

  const dbPath = getDbPath(dbName, cwd);
  if (existsSync(dbPath)) {
    rmSync(dbPath);
  }
}
