import { describe, expect, it, vi } from 'vitest';

import { Board, type BoardView } from '@/ui/lib/board.ts';
import type { ItemGateway } from '@/ui/lib/gateways.ts';
import { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';
import { ItemLists } from '@/ui/lib/item-lists.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';

const SMALL_SEED = { epics: 2, tasks: 60, subtasksPerTask: 0, comments: 0, events: 0 };
const VIEW: BoardView = { kind: 'all', epicId: null, sort: ItemQueries.manualSort };

abstract class BoardFixture {
  static async setup() {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const gateways = trekker.gateways();
    const notices = { error: vi.fn(), info: vi.fn() };
    const lists = new ItemLists(gateways.items);
    const board = new Board(lists, gateways.items, notices);
    const todo = board.column(VIEW, 'todo');
    const done = board.column(VIEW, 'completed');
    await Promise.all([todo.load(), done.load()]);
    return { trekker, board, todo, done, notices };
  }

  static ids(items: readonly ItemSummary[]) {
    return items.map((item) => {
      return item.id;
    });
  }
}

describe('Board', () => {
  it('reorders inside a column without changing its total', async () => {
    const { board, todo } = await BoardFixture.setup();
    const [first, second, third] = todo.state.items;
    if (!first || !second || !third) {
      throw new Error('expected three todo items');
    }
    const total = todo.state.total;
    await board.move(VIEW, { item: third, to: 'todo', anchorId: first.id, placement: 'before' });
    expect(BoardFixture.ids(todo.state.items).slice(0, 3)).toEqual([third.id, first.id, second.id]);
    expect(todo.state.total).toBe(total);
  });

  it('moves a card to another column after the anchor', async () => {
    const { board, todo, done, trekker } = await BoardFixture.setup();
    const card = todo.state.items[0];
    const anchor = done.state.items[0];
    if (!card || !anchor) {
      throw new Error('expected items in both columns');
    }
    const todoTotal = todo.state.total;
    const doneTotal = done.state.total;
    await board.move(VIEW, {
      item: card,
      to: 'completed',
      anchorId: anchor.id,
      placement: 'after',
    });
    expect(BoardFixture.ids(done.state.items).slice(0, 2)).toEqual([anchor.id, card.id]);
    expect(BoardFixture.ids(todo.state.items)).not.toContain(card.id);
    expect(todo.state.total).toBe(todoTotal - 1);
    expect(done.state.total).toBe(doneTotal + 1);
    expect(trekker.find(card.id).status).toBe('completed');
  });

  it('restores the column and reports when the server rejects a move', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const items = trekker.gateways().items;
    const notices = { error: vi.fn(), info: vi.fn() };
    const failingGateway: ItemGateway = {
      list: (query, cursor) => {
        return items.list(query, cursor);
      },
      count: (query) => {
        return items.count(query);
      },
      byIds: (lookup) => {
        return items.byIds(lookup);
      },
      search: (query, cursor) => {
        return items.search(query, cursor);
      },
      move: () => {
        return Promise.reject(new Error('conflict'));
      },
      archiveCompleted: () => {
        return items.archiveCompleted();
      },
    };
    const board = new Board(new ItemLists(failingGateway), failingGateway, notices);
    const todo = board.column(VIEW, 'todo');
    await todo.load();
    const card = todo.state.items[0];
    if (!card) {
      throw new Error('expected a todo item');
    }
    await board.move(VIEW, { item: card, to: 'completed', anchorId: null, placement: 'before' });
    expect(notices.error).toHaveBeenCalledOnce();
    expect(BoardFixture.ids(todo.state.items)).toContain(card.id);
    expect(trekker.find(card.id).status).toBe('todo');
  });

  it('refuses to drop an epic on wont_fix', () => {
    expect(
      Board.canDrop(
        {
          kind: 'epic',
          id: 'EPIC-1',
          title: 'Epic',
          status: 'todo',
          priority: 2,
          rank: null,
          tags: [],
          epic: null,
          parent: null,
          subtasks: { total: 0, done: 0 },
          blockedBy: 0,
          progress: { total: 0, done: 0 },
          commentCount: 0,
          createdAt: 0,
          updatedAt: 0,
        },
        'wont_fix'
      )
    ).toBe(false);
  });
});
