import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { generateNKeysBetween } from 'fractional-indexing';
import * as schema from '@/src/db/schema';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_CONFIG_DEFAULTS } from '@/src/types';

interface SqliteObjectRow {
  name: string;
  sql: string | null;
}

interface ConfigKeyRow {
  key: string;
}

export abstract class DbClient {
  private static dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
  private static sqliteInstance: Database | null = null;

  private static getTrekkerDir(cwd: string = process.cwd()): string {
    return join(cwd, TREKKER_DIR);
  }

  static getDbPath(cwd: string = process.cwd()): string {
    return join(DbClient.getTrekkerDir(cwd), DB_NAME);
  }

  static isTrekkerInitialized(cwd: string = process.cwd()): boolean {
    return existsSync(DbClient.getDbPath(cwd));
  }

  private static ensureTrekkerDir(cwd: string = process.cwd()): void {
    const trekkerDir = DbClient.getTrekkerDir(cwd);
    if (!existsSync(trekkerDir)) {
      mkdirSync(trekkerDir, { recursive: true });
    }
  }

  private static openSqlite(dbPath: string): Database {
    const sqlite = new Database(dbPath);
    sqlite.run('PRAGMA foreign_keys = ON');
    sqlite.run(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
    return sqlite;
  }

  static getDb(cwd: string = process.cwd()) {
    if (DbClient.dbInstance) {
      return DbClient.dbInstance;
    }

    const dbPath = DbClient.getDbPath(cwd);
    if (!existsSync(dbPath)) {
      throw new Error("Trekker not initialized. Run 'trekker init' first.");
    }

    DbClient.sqliteInstance = DbClient.openSqlite(dbPath);
    DbClient.dbInstance = drizzle(DbClient.sqliteInstance, { schema });

    // Migrate existing databases to add search index if missing
    DbClient.migrateSearchIndex(DbClient.sqliteInstance);

    // Migrate existing databases to add history table if missing
    DbClient.migrateHistoryTable(DbClient.sqliteInstance);

    // Migrate existing databases to add project config if missing
    DbClient.migrateProjectConfigTable(DbClient.sqliteInstance);

    DbClient.migrateRankColumns(DbClient.sqliteInstance);

    DbClient.migrateSearchRowids(DbClient.sqliteInstance);

    DbClient.createDependencyIndexes(DbClient.sqliteInstance);
    DbClient.createQueryIndexes(DbClient.sqliteInstance);

    return DbClient.dbInstance;
  }

  static createDb(cwd: string = process.cwd()) {
    DbClient.ensureTrekkerDir(cwd);
    const dbPath = DbClient.getDbPath(cwd);

    DbClient.sqliteInstance = DbClient.openSqlite(dbPath);
    DbClient.dbInstance = drizzle(DbClient.sqliteInstance, { schema });

    // Create tables
    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS project_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS epics (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        priority INTEGER NOT NULL DEFAULT 2,
        rank TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    DbClient.sqliteInstance.run(`
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
        rank TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      )
    `);

    DbClient.createDependencyIndexes(DbClient.sqliteInstance);
    DbClient.createQueryIndexes(DbClient.sqliteInstance);

    DbClient.sqliteInstance.run(`
      CREATE TABLE IF NOT EXISTS id_counters (
        entity_type TEXT PRIMARY KEY,
        counter INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Initialize counters
    DbClient.sqliteInstance.run(
      "INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('task', 0)"
    );
    DbClient.sqliteInstance.run(
      "INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('epic', 0)"
    );
    DbClient.sqliteInstance.run(
      "INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES ('comment', 0)"
    );

    DbClient.seedProjectConfig(DbClient.sqliteInstance);

    // Events table for history/logbook
    DbClient.sqliteInstance.run(`
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

    DbClient.sqliteInstance.run(
      'CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id)'
    );
    DbClient.sqliteInstance.run(
      'CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(entity_type, action)'
    );
    DbClient.sqliteInstance.run(
      'CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)'
    );

    // Create FTS5 search index and triggers
    DbClient.createSearchIndex(DbClient.sqliteInstance);

    // Create history event triggers
    DbClient.createHistoryTriggers(DbClient.sqliteInstance);

    return DbClient.dbInstance;
  }

  private static createSearchIndex(sqlite: Database): void {
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

    const epicRow = `NEW.rowid + ${EPIC_SEARCH_ROWID_OFFSET}, NEW.id, 'epic', NEW.title, NEW.description, '', NEW.status, NULL`;
    const taskRow = `NEW.rowid, NEW.id, IIF(NEW.parent_task_id IS NULL, 'task', 'subtask'), NEW.title,
          NEW.description, '', NEW.status, COALESCE(NEW.parent_task_id, NEW.epic_id)`;
    const commentRow = `NEW.rowid + ${COMMENT_SEARCH_ROWID_OFFSET}, NEW.id, 'comment', '', NEW.content, NEW.author, '', NEW.task_id`;

    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS epics_search_insert AFTER INSERT ON epics BEGIN
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${epicRow});
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS epics_search_delete AFTER DELETE ON epics BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid + ${EPIC_SEARCH_ROWID_OFFSET};
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS epics_search_update AFTER UPDATE ON epics
      WHEN OLD.title IS NOT NEW.title OR OLD.description IS NOT NEW.description
        OR OLD.status IS NOT NEW.status
      BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid + ${EPIC_SEARCH_ROWID_OFFSET};
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${epicRow});
      END
    `);

    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS tasks_search_insert AFTER INSERT ON tasks BEGIN
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${taskRow});
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS tasks_search_delete AFTER DELETE ON tasks BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid;
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS tasks_search_update AFTER UPDATE ON tasks
      WHEN OLD.title IS NOT NEW.title OR OLD.description IS NOT NEW.description
        OR OLD.status IS NOT NEW.status OR OLD.parent_task_id IS NOT NEW.parent_task_id
        OR OLD.epic_id IS NOT NEW.epic_id
      BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid;
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${taskRow});
      END
    `);

    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS comments_search_insert AFTER INSERT ON comments BEGIN
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${commentRow});
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS comments_search_delete AFTER DELETE ON comments BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid + ${COMMENT_SEARCH_ROWID_OFFSET};
      END
    `);
    sqlite.run(`
      CREATE TRIGGER IF NOT EXISTS comments_search_update AFTER UPDATE ON comments
      WHEN OLD.content IS NOT NEW.content OR OLD.author IS NOT NEW.author
        OR OLD.task_id IS NOT NEW.task_id
      BEGIN
        DELETE FROM search_index WHERE rowid = OLD.rowid + ${COMMENT_SEARCH_ROWID_OFFSET};
        INSERT INTO search_index(${SEARCH_COLUMNS}) VALUES (${commentRow});
      END
    `);
  }

  private static hasRowidSearchTriggers(sqlite: Database): boolean {
    const rows = sqlite
      .query<
        SqliteObjectRow,
        []
      >("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND name LIKE '%_search_%'")
      .all();
    return SEARCH_TRIGGERS.every((name) => {
      const trigger = rows.find((row) => {
        return row.name === name;
      });
      return trigger?.sql?.includes('rowid') === true;
    });
  }

  private static migrateSearchRowids(sqlite: Database): void {
    if (DbClient.hasRowidSearchTriggers(sqlite)) {
      return;
    }
    const migrate = sqlite.transaction(() => {
      if (DbClient.hasRowidSearchTriggers(sqlite)) {
        return;
      }
      for (const trigger of SEARCH_TRIGGERS) {
        sqlite.run(`DROP TRIGGER IF EXISTS ${trigger}`);
      }
      sqlite.run('DELETE FROM search_index');
      DbClient.populateSearchIndex(sqlite);
      DbClient.createSearchIndex(sqlite);
    });
    migrate.immediate();
  }

  private static migrateSearchIndex(sqlite: Database): void {
    // Check if search_index exists
    const tableExists = sqlite
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name='search_index'")
      .get();

    if (!tableExists) {
      // Create the search index and triggers
      DbClient.createSearchIndex(sqlite);

      // Populate from existing data
      DbClient.populateSearchIndex(sqlite);
    }
  }

  private static populateSearchIndex(sqlite: Database): void {
    sqlite.run(`
      INSERT INTO search_index(${SEARCH_COLUMNS})
      SELECT rowid + ${EPIC_SEARCH_ROWID_OFFSET}, id, 'epic', title, description, '', status, NULL FROM epics
    `);
    sqlite.run(`
      INSERT INTO search_index(${SEARCH_COLUMNS})
      SELECT rowid, id, IIF(parent_task_id IS NULL, 'task', 'subtask'), title, description, '', status,
        COALESCE(parent_task_id, epic_id)
      FROM tasks
    `);
    sqlite.run(`
      INSERT INTO search_index(${SEARCH_COLUMNS})
      SELECT rowid + ${COMMENT_SEARCH_ROWID_OFFSET}, id, 'comment', '', content, author, '', task_id
      FROM comments
    `);
  }

  private static createHistoryTriggers(sqlite: Database): void {
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

  private static migrateHistoryTable(sqlite: Database): void {
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

      sqlite.run('CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id)');
      sqlite.run(
        'CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(entity_type, action)'
      );
      sqlite.run('CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)');

      // Create the triggers
      DbClient.createHistoryTriggers(sqlite);
    }
  }

  private static createDependencyIndexes(sqlite: Database): void {
    sqlite.run('CREATE INDEX IF NOT EXISTS idx_dependencies_task ON dependencies(task_id)');
    sqlite.run(
      'CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON dependencies(depends_on_id)'
    );
  }

  private static createQueryIndexes(sqlite: Database): void {
    sqlite.run('CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at)');
    sqlite.run('CREATE INDEX IF NOT EXISTS idx_tasks_status_updated ON tasks(status, updated_at)');
    sqlite.run(
      'CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL'
    );
    sqlite.run(
      'CREATE INDEX IF NOT EXISTS idx_tasks_epic ON tasks(epic_id, parent_task_id, status) WHERE epic_id IS NOT NULL'
    );
    sqlite.run('CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id)');
    sqlite.run(
      "CREATE INDEX IF NOT EXISTS idx_tasks_status_rank ON tasks(status, COALESCE(rank, ''))"
    );
    sqlite.run(
      "CREATE INDEX IF NOT EXISTS idx_epics_status_rank ON epics(status, COALESCE(rank, ''))"
    );
  }

  private static hasRankColumn(sqlite: Database): boolean {
    return sqlite
      .query<ColumnRow, []>('PRAGMA table_info(tasks)')
      .all()
      .some((column) => {
        return column.name === 'rank';
      });
  }

  private static backfillRanks(sqlite: Database): void {
    const targets = sqlite
      .query<RankTargetRow, []>(
        `SELECT source, id FROM (
          SELECT 'epics' AS source, id, created_at FROM epics
          UNION ALL
          SELECT 'tasks' AS source, id, created_at FROM tasks
        ) ORDER BY created_at DESC, id DESC`
      )
      .all();
    const keys = generateNKeysBetween(null, null, targets.length);
    const updates = {
      epics: sqlite.query<unknown, [string, string]>('UPDATE epics SET rank = ? WHERE id = ?'),
      tasks: sqlite.query<unknown, [string, string]>('UPDATE tasks SET rank = ? WHERE id = ?'),
    };
    for (const [index, target] of targets.entries()) {
      updates[target.source].run(keys[index], target.id);
    }
  }

  private static migrateRankColumns(sqlite: Database): void {
    if (DbClient.hasRankColumn(sqlite)) {
      return;
    }
    const migrate = sqlite.transaction(() => {
      if (DbClient.hasRankColumn(sqlite)) {
        return;
      }
      sqlite.run('ALTER TABLE epics ADD COLUMN rank TEXT');
      sqlite.run('ALTER TABLE tasks ADD COLUMN rank TEXT');
      for (const trigger of RANK_REBUILT_TRIGGERS) {
        sqlite.run(`DROP TRIGGER IF EXISTS ${trigger}`);
      }
      DbClient.backfillRanks(sqlite);
      DbClient.createSearchIndex(sqlite);
      DbClient.createHistoryTriggers(sqlite);
    });
    migrate.immediate();
  }

  private static seedProjectConfig(sqlite: Database): void {
    const existingKeys = new Set(
      sqlite
        .query<ConfigKeyRow, []>('SELECT key FROM project_config')
        .all()
        .map((row) => {
          return row.key;
        })
    );
    for (const [key, value] of Object.entries(PROJECT_CONFIG_DEFAULTS)) {
      if (!existingKeys.has(key)) {
        sqlite
          .query('INSERT OR IGNORE INTO project_config (key, value) VALUES (?, ?)')
          .run(key, value);
      }
    }
  }

  private static migrateProjectConfigTable(sqlite: Database): void {
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS project_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    DbClient.seedProjectConfig(sqlite);
  }

  static rebuildSearchIndex(): void {
    // Ensure database is initialized first
    DbClient.getDb();
    const sqlite = DbClient.getSqliteInstance();
    if (!sqlite) {
      throw new Error('Database not initialized');
    }

    // Clear and repopulate the search index
    sqlite.run('DELETE FROM search_index');
    DbClient.populateSearchIndex(sqlite);
  }

  private static getSqliteInstance(): Database | null {
    return DbClient.sqliteInstance;
  }

  static requireSqliteInstance(): Database {
    DbClient.getDb();
    if (!DbClient.sqliteInstance) {
      throw new Error('Database not initialized');
    }
    return DbClient.sqliteInstance;
  }

  private static closeDb(): void {
    if (DbClient.sqliteInstance) {
      DbClient.sqliteInstance.close();
      DbClient.sqliteInstance = null;
      DbClient.dbInstance = null;
    }
  }

  static deleteDb(cwd: string = process.cwd()): void {
    DbClient.closeDb();
    const trekkerDir = DbClient.getTrekkerDir(cwd);
    if (existsSync(trekkerDir)) {
      rmSync(trekkerDir, { recursive: true, force: true });
    }
  }

  static readonly getDataVersion = (): number => {
    const row = DbClient.requireSqliteInstance()
      .query<DataVersionRow, []>('PRAGMA data_version')
      .get();
    return row?.data_version ?? 0;
  };
}

const TREKKER_DIR = '.trekker';
const DB_NAME = 'trekker.db';

const BUSY_TIMEOUT_MS = 5000;

const EPIC_SEARCH_ROWID_OFFSET = 1_000_000_000_000;
const COMMENT_SEARCH_ROWID_OFFSET = 2_000_000_000_000;

const SEARCH_TRIGGERS = [
  'epics_search_insert',
  'epics_search_delete',
  'epics_search_update',
  'tasks_search_insert',
  'tasks_search_delete',
  'tasks_search_update',
  'comments_search_insert',
  'comments_search_delete',
  'comments_search_update',
];

const SEARCH_COLUMNS = 'rowid, entity_id, entity_type, title, content, author, status, parent_id';

interface ColumnRow {
  name: string;
}

interface RankTargetRow {
  source: 'epics' | 'tasks';
  id: string;
}

const RANK_REBUILT_TRIGGERS = [
  'epics_history_update',
  'tasks_history_update',
  'epics_search_update',
  'tasks_search_update',
];

interface DataVersionRow {
  data_version: number;
}
