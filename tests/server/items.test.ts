import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { TestTarget } from '@/tests/helpers/workspace';
import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import {
  type ApiError,
  type ItemSummary,
  type Page,
  type SeededProject,
  ServerFixtures,
} from '@/tests/server/fixtures';

abstract class ItemsFixture {
  private static sortValue(item: ItemSummary, field: SortField): string | number {
    if (field === 'created') {
      return item.createdAt;
    }
    if (field === 'updated') {
      return item.updatedAt;
    }
    if (field === 'priority') {
      return item.priority;
    }
    return item.title;
  }

  private static compareValues(left: string | number, right: string | number): number {
    if (left === right) {
      return 0;
    }
    if (left < right) {
      return -1;
    }
    return 1;
  }

  private static compareKeys(a: ItemSummary, b: ItemSummary, field: SortField): number {
    return (
      ItemsFixture.compareValues(
        ItemsFixture.sortValue(a, field),
        ItemsFixture.sortValue(b, field)
      ) || ItemsFixture.compareValues(a.id, b.id)
    );
  }

  static referenceOrder(items: ItemSummary[], field: SortField, direction: Direction): string[] {
    let sign = 1;
    if (direction === 'desc') {
      sign = -1;
    }
    return [...items]
      .sort((a, b) => {
        return sign * ItemsFixture.compareKeys(a, b, field);
      })
      .map((item) => {
        return item.id;
      });
  }
}

type SortField = 'created' | 'updated' | 'priority' | 'title';
type Direction = 'asc' | 'desc';

const SORT_FIELDS: SortField[] = ['created', 'updated', 'priority', 'title'];
const DIRECTIONS: Direction[] = ['asc', 'desc'];

describe.skipIf(TestTarget.isContainer)('GET /api/items', () => {
  let ctx: TestContext;
  let server: ServeHandle;
  let seed: SeededProject;
  let all: ItemSummary[];

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
    seed = await ServerFixtures.seedProject(server);
    const reply = await server.json<Page<ItemSummary>>('/api/items?limit=200');
    all = reply.body.items;
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  it('returns epics, tasks and subtasks from both tables', () => {
    expect(all).toHaveLength(13);
    expect(
      all.filter((item) => {
        return item.kind === 'epic';
      })
    ).toHaveLength(3);
    expect(
      all.filter((item) => {
        return item.kind === 'task';
      })
    ).toHaveLength(7);
    expect(
      all.filter((item) => {
        return item.kind === 'subtask';
      })
    ).toHaveLength(3);
  });

  for (const field of SORT_FIELDS) {
    for (const direction of DIRECTIONS) {
      it(`pages ${field}:${direction} without gaps or duplicates`, async () => {
        const path = `/api/items?sort=${field}:${direction}&limit=3`;
        const { items, totals, pages } = await ServerFixtures.collectPages<ItemSummary>(
          server,
          path
        );
        const ids = items.map((item) => {
          return item.id;
        });

        expect(pages).toBe(5);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual(ItemsFixture.referenceOrder(all, field, direction));
        expect(new Set(totals)).toEqual(new Set([13]));
      });
    }
  }

  it('pages a board column one item at a time across both tables', async () => {
    const { items, totals } = await ServerFixtures.collectPages<ItemSummary>(
      server,
      '/api/items?type=epic,task&status=todo&sort=title:asc&limit=1'
    );
    expect(
      items.map((item) => {
        return item.title;
      })
    ).toEqual(['Alpha epic', 'Fix bug', 'Write docs', 'Zebra task']);
    expect(
      totals.every((total) => {
        return total === 4;
      })
    ).toBe(true);
  });

  it('returns no cursor on the last page', async () => {
    const { body } = await server.json<Page<ItemSummary>>('/api/items?type=epic&limit=3');
    expect(body.items).toHaveLength(3);
    expect(body.nextCursor).toBeNull();
  });

  it('filters by type, status, priority, epic and parent', async () => {
    const ids = async (query: string): Promise<string[]> => {
      const { body } = await server.json<Page<ItemSummary>>(`/api/items?${query}&sort=title:asc`);
      return body.items
        .map((item) => {
          return item.id;
        })
        .sort();
    };

    const epicIds = await ids('type=epic');
    expect(epicIds).toEqual(Object.values(seed.epics).sort());
    const subtaskIds = await ids('type=subtask');
    expect(subtaskIds).toEqual(Object.values(seed.subtasks).sort());
    const urgentIds = await ids('priority=0,1');
    expect(urgentIds).toEqual(
      [seed.epics.alpha, seed.epics.gamma, seed.tasks.login, seed.tasks.bug].sort()
    );
    const alphaIds = await ids(`epic=${seed.epics.alpha}`);
    expect(alphaIds).toEqual(
      [seed.tasks.docs, seed.tasks.login, seed.subtasks.one, seed.subtasks.two].sort()
    );
    const alphaTaskIds = await ids(`type=task&epic=${seed.epics.alpha}`);
    expect(alphaTaskIds).toEqual([seed.tasks.docs, seed.tasks.login].sort());
    const docsChildIds = await ids(`parent=${seed.tasks.docs}`);
    expect(docsChildIds).toEqual([seed.subtasks.one, seed.subtasks.two].sort());
    const docsChildTaskIds = await ids(`type=task&parent=${seed.tasks.docs}`);
    expect(docsChildTaskIds).toEqual([]);
    const closedIds = await ids('status=wont_fix,archived');
    expect(closedIds).toEqual([seed.tasks.lower, seed.tasks.middle].sort());
  });

  it('filters by a created or updated date range', async () => {
    const old = 946_684_800;
    ctx.query(
      `UPDATE tasks SET created_at = ${old}, updated_at = ${old} WHERE id = '${seed.tasks.zebra}'`
    );
    const cutoffMs = (old + 86_400) * 1000;
    const ids = async (query: string): Promise<string[]> => {
      const { body } = await server.json<Page<ItemSummary>>(`/api/items?${query}`);
      return body.items.map((item) => {
        return item.id;
      });
    };

    const createdBeforeIds = await ids(`dateField=created&to=${cutoffMs}`);
    expect(createdBeforeIds).toEqual([seed.tasks.zebra]);
    const updatedBeforeIds = await ids(`dateField=updated&to=${cutoffMs}`);
    expect(updatedBeforeIds).toEqual([seed.tasks.zebra]);
    const createdAfterIds = await ids(`dateField=created&from=${cutoffMs}&limit=200`);
    expect(createdAfterIds).not.toContain(seed.tasks.zebra);
    const reply = await server.json<ApiError>('/api/items?dateField=yesterday&from=1');
    expect(reply.status).toBe(400);
  });

  it('enriches only the returned rows with refs and counts', () => {
    const byId = new Map(
      all.map((item) => {
        return [item.id, item];
      })
    );
    const docs = byId.get(seed.tasks.docs);
    expect(docs?.epic).toEqual({ id: seed.epics.alpha, title: 'Alpha epic', status: 'todo' });
    expect(docs?.parent).toBeNull();
    expect(docs?.tags).toEqual(['docs', 'api']);
    expect(docs?.subtasks).toEqual({ total: 2, done: 1 });
    expect(docs?.blockedBy).toBe(1);
    expect(docs?.commentCount).toBe(3);
    expect(docs?.progress).toBeNull();

    const subtask = byId.get(seed.subtasks.one);
    expect(subtask?.kind).toBe('subtask');
    expect(subtask?.parent?.id).toBe(seed.tasks.docs);
    expect(subtask?.epic?.id).toBe(seed.epics.alpha);

    expect(byId.get(seed.epics.alpha)?.progress).toEqual({ total: 2, done: 0 });
    expect(byId.get(seed.epics.gamma)?.progress).toEqual({ total: 1, done: 1 });
    expect(byId.get(seed.tasks.bug)?.blockedBy).toBe(1);
    expect(typeof docs?.createdAt).toBe('number');
    expect(docs?.createdAt).toBeGreaterThan(1_000_000_000_000);
  });

  it('rejects invalid queries and cursors', async () => {
    const expectInvalid = async (query: string): Promise<void> => {
      const { status, body } = await server.json<ApiError>(`/api/items?${query}`);
      expect(status).toBe(400);
      expect(body.error.code).toBe('invalid_request');
    };

    await expectInvalid('type=comment');
    await expectInvalid('status=done');
    await expectInvalid('priority=9');
    await expectInvalid('limit=201');
    await expectInvalid('limit=0');
    await expectInvalid('sort=updated:sideways');
    await expectInvalid('cursor=not-a-cursor');

    const first = await server.json<Page<ItemSummary>>('/api/items?sort=title:asc&limit=2');
    await expectInvalid(`sort=priority:asc&cursor=${first.body.nextCursor}`);
  });
});
