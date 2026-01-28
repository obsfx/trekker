import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as sqliteVec from "sqlite-vec";
import * as schema from "./schema";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const EMBEDDING_DIMENSION = 256;

const TREKKER_DIR = ".trekker";
const DB_NAME = "trekker.db";

let sqliteVecLoaded = false;

function loadSqliteVec(sqlite: Database): boolean {
  try {
    sqliteVec.load(sqlite);
    return true;
  } catch {
    // sqlite-vec extension loading failed (likely unsupported SQLite build)
    // Semantic search features will be unavailable
    return false;
  }
}

export function isSqliteVecAvailable(): boolean {
  return sqliteVecLoaded;
}

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
  sqliteVecLoaded = loadSqliteVec(sqliteInstance);
  dbInstance = drizzle(sqliteInstance, { schema });

  // Migrate existing databases to add search index if missing
  migrateSearchIndex(sqliteInstance);

  // Migrate existing databases to add embeddings table if missing (only if sqlite-vec is available)
  if (sqliteVecLoaded) {
    migrateEmbeddingsTable(sqliteInstance);
  }

  // Migrate existing databases to add history table if missing
  migrateHistoryTable(sqliteInstance);

  return dbInstance;
}

export function createDb(cwd: string = process.cwd()) {
  ensureTrekkerDir(cwd);
  const dbPath = getDbPath(cwd);

  sqliteInstance = new Database(dbPath);
  sqliteVecLoaded = loadSqliteVec(sqliteInstance);
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
  createSearchIndex(sqliteInstance);

  // Create history event triggers
  createHistoryTriggers(sqliteInstance);

  // Create embeddings virtual table and metadata table (only if sqlite-vec is available)
  if (sqliteVecLoaded) {
    createEmbeddingsTable(sqliteInstance);
  }

  return dbInstance;
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

function createEmbeddingsTable(sqlite: Database): void {
  // Create vec0 virtual table for vector embeddings
  sqlite.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
      entity_id TEXT,
      entity_type TEXT,
      embedding float[${EMBEDDING_DIMENSION}]
    )
  `);

  // Create embedding_meta table for model versioning
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS embedding_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

function migrateEmbeddingsTable(sqlite: Database): void {
  // Check if embeddings table exists
  const tableExists = sqlite
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='embeddings'")
    .get();

  if (!tableExists) {
    createEmbeddingsTable(sqlite);
  }
}

export function rebuildSearchIndex(): void {
  // Ensure database is initialized first
  getDb();
  const sqlite = getSqliteInstance();
  if (!sqlite) {
    throw new Error("Database not initialized");
  }

  // Clear and repopulate the search index
  sqlite.run("DELETE FROM search_index");
  populateSearchIndex(sqlite);
}

export function getSqliteInstance(): Database | null {
  return sqliteInstance;
}

export function requireSqliteInstance(): Database {
  getDb();
  if (!sqliteInstance) {
    throw new Error("Database not initialized");
  }
  return sqliteInstance;
}

export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    sqliteVecLoaded = false;
  }
}

export function deleteDb(cwd: string = process.cwd()): void {
  closeDb();
  const trekkerDir = getTrekkerDir(cwd);
  if (existsSync(trekkerDir)) {
    rmSync(trekkerDir, { recursive: true, force: true });
  }
}

// Embedding helper types
export interface EmbeddingRow {
  entity_id: string;
  entity_type: string;
  embedding: ArrayBuffer;
  distance?: number;
}

function requireSqliteVec(): void {
  if (!sqliteVecLoaded) {
    throw new Error(
      "Semantic search is not available. Your SQLite build does not support dynamic extension loading."
    );
  }
}

// Embedding helper functions
export function getEmbedding(entityId: string): EmbeddingRow | null {
  requireSqliteVec();
  const sqlite = requireSqliteInstance();
  const result = sqlite
    .query<EmbeddingRow, [string]>(
      "SELECT entity_id, entity_type, embedding FROM embeddings WHERE entity_id = ?"
    )
    .get(entityId);
  return result ?? null;
}

export function upsertEmbedding(
  entityId: string,
  entityType: string,
  embedding: Float32Array
): void {
  requireSqliteVec();
  const sqlite = requireSqliteInstance();

  // Validate embedding dimension
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
    );
  }

  // Use transaction to ensure atomicity of delete + insert
  const upsert = sqlite.transaction(() => {
    // Delete existing embedding if present
    sqlite.run("DELETE FROM embeddings WHERE entity_id = ?", [entityId]);

    // Insert new embedding
    sqlite
      .query(
        "INSERT INTO embeddings (entity_id, entity_type, embedding) VALUES (?, ?, ?)"
      )
      .run(entityId, entityType, embedding.buffer);
  });

  upsert();
}

export function deleteEmbedding(entityId: string): void {
  requireSqliteVec();
  const sqlite = requireSqliteInstance();
  sqlite.run("DELETE FROM embeddings WHERE entity_id = ?", [entityId]);
}

export function getEmbeddingMeta(key: string): string | null {
  requireSqliteVec();
  const sqlite = requireSqliteInstance();
  const result = sqlite
    .query<{ value: string }, [string]>(
      "SELECT value FROM embedding_meta WHERE key = ?"
    )
    .get(key);
  return result?.value ?? null;
}

export function setEmbeddingMeta(key: string, value: string): void {
  requireSqliteVec();
  const sqlite = requireSqliteInstance();
  sqlite.run(
    "INSERT OR REPLACE INTO embedding_meta (key, value) VALUES (?, ?)",
    [key, value]
  );
}
