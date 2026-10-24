import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createTestContext, initTrekker, type TestContext } from '../helpers/test-context';

interface PaginatedResponse {
  total: number;
  page: number;
  limit: number;
  items: { id: string }[];
}

interface PaginatedCommand {
  name: string;
  base: (parentId: string) => string;
  paged: (parentId: string, limit: string, page: string) => string;
}

const ITEM_COUNT = 3;

const PAGINATED_COMMANDS: PaginatedCommand[] = [
  {
    name: 'epic list',
    base: () => 'epic list',
    paged: (_parentId, limit, page) => `epic list --limit ${limit} --page ${page}`,
  },
  {
    name: 'task list',
    base: () => 'task list',
    paged: (_parentId, limit, page) => `task list --limit ${limit} --page ${page}`,
  },
  {
    name: 'subtask list',
    base: (parentId) => `subtask list ${parentId}`,
    paged: (parentId, limit, page) => `subtask list ${parentId} --limit ${limit} --page ${page}`,
  },
  {
    name: 'comment list',
    base: (parentId) => `comment list ${parentId}`,
    paged: (parentId, limit, page) => `comment list ${parentId} --limit ${limit} --page ${page}`,
  },
  {
    name: 'ready',
    base: () => 'ready',
    paged: (_parentId, limit, page) => `ready --limit ${limit} --page ${page}`,
  },
];

describe('pagination options on list commands', () => {
  let ctx: TestContext;
  let parentId: string;

  beforeAll(() => {
    ctx = createTestContext();
    initTrekker(ctx);
    parentId = ctx.runToon<{ id: string }>('task create -t "Parent"').id;
    for (let index = 0; index < ITEM_COUNT; index++) {
      ctx.run(`epic create -t "Epic ${index}"`);
      ctx.run(`subtask create ${parentId} -t "Subtask ${index}"`);
      ctx.run(`comment add ${parentId} -a tester -c "Comment ${index}"`);
    }
    for (let index = 1; index < ITEM_COUNT; index++) {
      ctx.run(`task create -t "Task ${index}"`);
    }
  });

  afterAll(() => {
    ctx.cleanup();
  });

  for (const command of PAGINATED_COMMANDS) {
    describe(command.name, () => {
      it('defaults to page 1 with a limit of 50', () => {
        const result = ctx.runToon<PaginatedResponse>(command.base(parentId));
        expect(result.page).toBe(1);
        expect(result.limit).toBe(50);
        expect(result.total).toBe(ITEM_COUNT);
        expect(result.items).toHaveLength(ITEM_COUNT);
      });

      it('splits results across pages', () => {
        const first = ctx.runToon<PaginatedResponse>(command.paged(parentId, '2', '1'));
        const second = ctx.runToon<PaginatedResponse>(command.paged(parentId, '2', '2'));

        expect(first.items).toHaveLength(2);
        expect(second.items).toHaveLength(1);
        expect(first.total).toBe(ITEM_COUNT);
        expect(second.page).toBe(2);

        const ids = [...first.items, ...second.items].map((item) => item.id);
        expect(new Set(ids).size).toBe(ITEM_COUNT);
      });

      it('returns an empty page past the end', () => {
        const result = ctx.runToon<PaginatedResponse>(command.paged(parentId, '2', '5'));
        expect(result.items).toHaveLength(0);
        expect(result.total).toBe(ITEM_COUNT);
      });

      it('rejects invalid limit and page values', () => {
        expect(ctx.runExpectError(command.paged(parentId, '0', '1'))).toContain('Invalid limit');
        expect(ctx.runExpectError(command.paged(parentId, 'abc', '1'))).toContain('Invalid limit');
        expect(ctx.runExpectError(command.paged(parentId, '2', '0'))).toContain('Invalid page');
        expect(ctx.runExpectError(command.paged(parentId, '2', '-1'))).toContain('Invalid page');
      });
    });
  }
});
