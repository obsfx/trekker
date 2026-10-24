import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { join } from 'node:path';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { DB_RELATIVE_PATH, TestTarget } from '@/tests/helpers/workspace';
import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import { SseReader } from '@/tests/helpers/sse';
import {
  type ApiError,
  type ItemSummary,
  type Page,
  ServerFixtures,
} from '@/tests/server/fixtures';
import type { Totaled, Identified, SearchResults } from '@/tests/helpers/shapes';
import type { FieldChange } from '@/src/types';

interface RankRow {
  id: string;
  rank: string | null;
}

interface NamedRow {
  name: string;
}

interface TitleTarget {
  to: string;
}

interface TitleChange {
  title?: TitleTarget;
}

interface RankedEvent {
  entityId: string;
  changes?: TitleChange;
}

interface RankedEventPage {
  events: RankedEvent[];
}

abstract class RankFixture {
  static withDatabase<T>(cwd: string, run: (db: Database) => T): T {
    const db = new Database(join(cwd, DB_RELATIVE_PATH));
    try {
      return run(db);
    } finally {
      db.close();
    }
  }

  static count(db: Database, sql: string): number {
    const row = db.query<Totaled, []>(sql).get();
    return row?.total ?? 0;
  }
}

const CLI_ENTRY = join(import.meta.dir, '../../src/index.ts');

interface RankedSummary extends ItemSummary {
  rank: string | null;
}

interface HistoryEvent {
  id: number;
  action: string;
  entityId: string;
  changes: Record<string, FieldChange> | null;
}

describe.skipIf(TestTarget.isContainer)('rank migration', () => {
  let ctx: TestContext;

  beforeAll(() => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    ctx.run('epic create -t "Old epic"');
    ctx.run('task create -t "Old task one"');
    ctx.run('task create -t "Old task two"');
    ctx.run('subtask create TREK-1 -t "Old subtask"');
  });

  afterAll(() => {
    ctx?.cleanup();
  });

  it('backfills ranks newest first without writing events and keeps the triggers', () => {
    const eventsBefore = RankFixture.withDatabase(ctx.cwd, (db) => {
      db.run('DROP INDEX idx_tasks_status_rank');
      db.run('DROP INDEX idx_epics_status_rank');
      db.run('ALTER TABLE tasks DROP COLUMN rank');
      db.run('ALTER TABLE epics DROP COLUMN rank');
      db.run("UPDATE epics SET created_at = 100 WHERE id = 'EPIC-1'");
      db.run("UPDATE tasks SET created_at = 300 WHERE id = 'TREK-1'");
      db.run("UPDATE tasks SET created_at = 200 WHERE id IN ('TREK-2', 'TREK-3')");
      return RankFixture.count(db, 'SELECT COUNT(*) AS total FROM events');
    });

    ctx.run('list');

    RankFixture.withDatabase(ctx.cwd, (db) => {
      expect(RankFixture.count(db, 'SELECT COUNT(*) AS total FROM events')).toBe(eventsBefore);
      const ranked = db
        .query<RankRow, []>(
          `SELECT id, rank FROM (SELECT id, rank FROM epics UNION ALL SELECT id, rank FROM tasks)
           ORDER BY rank`
        )
        .all();
      expect(
        ranked.map((row) => {
          return row.id;
        })
      ).toEqual(['TREK-1', 'TREK-3', 'TREK-2', 'EPIC-1']);
      expect(
        ranked.every((row) => {
          return row.rank !== null;
        })
      ).toBe(true);
      const triggers = db
        .query<NamedRow, []>("SELECT name FROM sqlite_master WHERE type = 'trigger'")
        .all()
        .map((row) => {
          return row.name;
        });
      expect(triggers).toEqual(
        expect.arrayContaining([
          'tasks_history_update',
          'epics_history_update',
          'tasks_search_update',
          'epics_search_update',
        ])
      );
      expect(
        RankFixture.count(
          db,
          "SELECT COUNT(*) AS total FROM sqlite_master WHERE name = 'idx_tasks_status_rank'"
        )
      ).toBe(1);
    });

    ctx.run('task update TREK-2 -t "Renamed after migration"');
    const history = ctx.runToon<RankedEventPage>('history --entity TREK-2');
    expect(history.events[0].changes?.title?.to).toBe('Renamed after migration');
    const found = ctx.runToon<SearchResults>('search "Renamed after migration"');
    expect(
      found.results.map((result) => {
        return result.id;
      })
    ).toContain('TREK-2');
  });

  it('ranks rows created afterwards above everything else', () => {
    ctx.run('task create -t "Newest"');
    const top = RankFixture.withDatabase(ctx.cwd, (db) => {
      return db
        .query<
          Identified,
          []
        >('SELECT id FROM (SELECT id, rank FROM epics UNION ALL SELECT id, rank FROM tasks) ORDER BY rank LIMIT 1')
        .get();
    });
    expect(top?.id).toBe('TREK-4');
  });

  it('gives concurrent creates distinct ranks', async () => {
    const creates = Array.from({ length: 8 }, (_, index) => {
      return Bun.spawn(['bun', CLI_ENTRY, 'task', 'create', '-t', `Parallel ${String(index)}`], {
        cwd: ctx.cwd,
        stdout: 'ignore',
        stderr: 'pipe',
      }).exited;
    });
    const exitCodes = await Promise.all(creates);
    expect(exitCodes).toEqual(
      Array.from({ length: 8 }, () => {
        return 0;
      })
    );
    const duplicates = RankFixture.withDatabase(ctx.cwd, (db) => {
      return RankFixture.count(
        db,
        `SELECT COUNT(*) AS count FROM (
          SELECT rank FROM (SELECT rank FROM epics UNION ALL SELECT rank FROM tasks)
          GROUP BY rank HAVING COUNT(*) > 1
        )`
      );
    });
    expect(duplicates).toBe(0);
  });
});

describe.skipIf(TestTarget.isContainer)('POST /api/items/:id/move', () => {
  let ctx: TestContext;
  let server: ServeHandle;
  const ids = { epic: '', one: '', two: '', three: '', busy: '' };

  async function create(path: string, body: unknown): Promise<string> {
    const { body: created } = await server.json<Identified>(
      path,
      ServeHelpers.jsonInit('POST', body)
    );
    return created.id;
  }

  async function column(status: string): Promise<string[]> {
    const { body } = await server.json<Page<RankedSummary>>(
      `/api/items?type=epic,task&status=${status}&sort=rank:asc&limit=200`
    );
    return body.items.map((item) => {
      return item.id;
    });
  }

  async function move(id: string, body: unknown) {
    return server.json<RankedSummary & ApiError>(
      `/api/items/${id}/move`,
      ServeHelpers.jsonInit('POST', body)
    );
  }

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
    ids.epic = await create('/api/epics', { title: 'Epic' });
    ids.one = await create('/api/tasks', { title: 'One' });
    ids.two = await create('/api/tasks', { title: 'Two' });
    ids.three = await create('/api/tasks', { title: 'Three' });
    ids.busy = await create('/api/tasks', { title: 'Busy', status: 'in_progress' });
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  it('puts new items at the top of their column', async () => {
    const order = await column('todo');
    expect(order).toEqual([ids.three, ids.two, ids.one, ids.epic]);
  });

  it('moves to the top, before and after anchors across both tables', async () => {
    const top = await move(ids.one, { status: 'todo', anchorId: null, placement: 'before' });
    expect(top.status).toBe(200);
    expect(top.body.id).toBe(ids.one);
    expect(typeof top.body.rank).toBe('string');
    let order = await column('todo');
    expect(order).toEqual([ids.one, ids.three, ids.two, ids.epic]);

    await move(ids.epic, { status: 'todo', anchorId: ids.two, placement: 'before' });
    order = await column('todo');
    expect(order).toEqual([ids.one, ids.three, ids.epic, ids.two]);

    await move(ids.three, { status: 'todo', anchorId: ids.epic, placement: 'after' });
    order = await column('todo');
    expect(order).toEqual([ids.one, ids.epic, ids.three, ids.two]);

    await move(ids.two, { status: 'todo', anchorId: ids.one, placement: 'after' });
    order = await column('todo');
    expect(order).toEqual([ids.one, ids.two, ids.epic, ids.three]);

    await move(ids.one, { status: 'todo', anchorId: ids.three, placement: 'after' });
    order = await column('todo');
    expect(order).toEqual([ids.two, ids.epic, ids.three, ids.one]);
  });

  it('changes status through the service in the same move', async () => {
    const moved = await move(ids.two, {
      status: 'in_progress',
      anchorId: ids.busy,
      placement: 'after',
    });
    expect(moved.status).toBe(200);
    expect(moved.body.status).toBe('in_progress');
    const inProgress = await column('in_progress');
    expect(inProgress).toEqual([ids.busy, ids.two]);
    const todo = await column('todo');
    expect(todo).toEqual([ids.epic, ids.three, ids.one]);

    const history = await server.json<Page<HistoryEvent>>(`/api/history?entity=${ids.two}&limit=1`);
    expect(history.body.items[0].changes).toEqual({ status: { from: 'todo', to: 'in_progress' } });

    const epic = await move(ids.epic, { status: 'completed', anchorId: null, placement: 'before' });
    expect(epic.body.status).toBe('completed');
  });

  it('rejects invalid moves', async () => {
    const expectError = async (id: string, body: unknown, status: number, code: string) => {
      const response = await move(id, body);
      expect(response.status).toBe(status);
      expect(response.body.error.code).toBe(code);
    };

    await expectError(
      ids.epic,
      { status: 'wont_fix', anchorId: null, placement: 'before' },
      400,
      'invalid_request'
    );
    await expectError(
      ids.one,
      { status: 'todo', anchorId: ids.busy, placement: 'before' },
      409,
      'conflict'
    );
    await expectError(
      ids.one,
      { status: 'todo', anchorId: ids.one, placement: 'before' },
      400,
      'invalid_request'
    );
    await expectError(
      ids.one,
      { status: 'todo', anchorId: 'TREK-404', placement: 'before' },
      404,
      'not_found'
    );
    await expectError(
      'TREK-404',
      { status: 'todo', anchorId: null, placement: 'before' },
      404,
      'not_found'
    );
    await expectError(
      ids.one,
      { status: 'todo', anchorId: null, placement: 'middle' },
      400,
      'invalid_request'
    );
    await expectError(ids.one, { status: 'todo', placement: 'before' }, 400, 'invalid_request');
  });

  it('keeps rank-only moves out of history but streams them', async () => {
    const reader = await SseReader.open(`${server.url}/api/events`);
    await reader.next();
    await move(ids.one, { status: 'todo', anchorId: null, placement: 'before' });
    const message = await reader.until((candidate) => {
      return candidate.event === 'message';
    });
    const event = JSON.parse(message.data);
    expect(event.entityId).toBe(ids.one);
    expect(event.changes).toEqual({});
    expect(event.taskId).toBe(ids.one);
    expect(event.title).toBe('One');
    await reader.close();

    const history = await server.json<Page<HistoryEvent>>(`/api/history?entity=${ids.one}`);
    expect(
      history.body.items.some((item) => {
        return item.action === 'update' && JSON.stringify(item.changes) === '{}';
      })
    ).toBe(false);
    expect(history.body.total).toBe(history.body.items.length);
  });

  it('orders rows without a rank first and ranks them on the next move', async () => {
    const legacyA = await create('/api/tasks', { title: 'Legacy A' });
    const legacyB = await create('/api/tasks', { title: 'Legacy B' });
    const legacy = [legacyA, legacyB];
    RankFixture.withDatabase(ctx.cwd, (db) => {
      db.run(`UPDATE tasks SET rank = NULL WHERE id IN ('${legacy[0]}', '${legacy[1]}')`);
    });

    const ordered = await column('todo');
    expect(ordered.slice(0, 2)).toEqual([...legacy].sort());
    const { items } = await ServerFixtures.collectPages<RankedSummary>(
      server,
      '/api/items?type=epic,task&status=todo&sort=rank:asc&limit=1'
    );
    expect(
      items.map((item) => {
        return item.id;
      })
    ).toEqual(ordered);
    expect(items[0].rank).toBeNull();

    const [first, second] = [...legacy].sort();
    await move(ids.three, { status: 'todo', anchorId: first, placement: 'after' });
    const reordered = await column('todo');
    expect(reordered.slice(0, 3)).toEqual([first, ids.three, second]);
    RankFixture.withDatabase(ctx.cwd, (db) => {
      expect(
        RankFixture.count(
          db,
          "SELECT COUNT(*) AS total FROM tasks WHERE rank IS NULL AND status = 'todo'"
        )
      ).toBe(0);
    });
  });

  it('places an item between anchors that share a rank', async () => {
    RankFixture.withDatabase(ctx.cwd, (db) => {
      db.run("UPDATE tasks SET rank = 'a5' WHERE id IN (?, ?)", [ids.one, ids.three]);
    });
    const ordered = await column('todo');
    const first =
      ordered.find((id) => {
        return id === ids.one || id === ids.three;
      }) ?? ids.one;
    let second = ids.one;
    if (first === ids.one) {
      second = ids.three;
    }
    await move(ids.two, { status: 'todo', anchorId: first, placement: 'after' });
    const after = await column('todo');
    expect(after.indexOf(ids.two)).toBe(after.indexOf(first) + 1);
    expect(after.indexOf(second)).toBe(after.indexOf(ids.two) + 1);
  });
});
