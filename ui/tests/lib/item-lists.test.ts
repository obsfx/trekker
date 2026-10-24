import { describe, expect, it } from 'vitest';

import { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';
import { ItemLists } from '@/ui/lib/item-lists.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';

const SMALL_SEED = { epics: 2, tasks: 120, subtasksPerTask: 0, comments: 0, events: 0 };

const todoQuery = { ...ItemQueries.empty(ItemQueries.manualSort), statuses: ['todo' as const] };

describe('ItemLists', () => {
  it('inserts a changed item into matching lists at its sorted position', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    todo.watch();
    await todo.load();
    const before = todo.state.total;
    const created = trekker.createTask({
      title: 'Fresh',
      description: null,
      priority: 1,
      status: 'todo',
      epicId: null,
      parentTaskId: null,
      tags: [],
    });
    lists.apply([trekker.summarize(trekker.find(created.id))], []);
    expect(todo.state.items[0]?.id).toBe(created.id);
    expect(todo.state.total).toBe(before + 1);
  });

  it('removes an item whose status no longer matches', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    todo.watch();
    await todo.load();
    const first = todo.state.items[0];
    if (!first) {
      throw new Error('expected a todo item');
    }
    const before = todo.state.total;
    lists.apply([{ ...first, status: 'completed' }], []);
    expect(
      todo.state.items.some((item) => {
        return item.id === first.id;
      })
    ).toBe(false);
    expect(todo.state.total).toBe(before - 1);
  });

  it('does not add an item that sorts after the last loaded row while more pages exist', async () => {
    const trekker = new InMemoryTrekker({ ...SMALL_SEED, tasks: 400 });
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    todo.watch();
    await todo.load();
    expect(todo.state.nextCursor).not.toBeNull();
    const last = todo.state.items.at(-1);
    if (!last) {
      throw new Error('expected rows');
    }
    lists.apply([{ ...last, id: 'TREK-9999', rank: 'zzzz' }], []);
    expect(
      todo.state.items.some((item) => {
        return item.id === 'TREK-9999';
      })
    ).toBe(false);
  });

  it('drops ids the server no longer returns when refreshing', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    todo.watch();
    await todo.load();
    const first = todo.state.items[0];
    if (!first) {
      throw new Error('expected a todo item');
    }
    trekker.removeItem(first.id);
    await lists.refreshIds([first.id]);
    expect(
      todo.state.items.some((item) => {
        return item.id === first.id;
      })
    ).toBe(false);
  });

  it('drops a loaded item that moved past the fetched boundary without changing the total', async () => {
    const trekker = new InMemoryTrekker({ ...SMALL_SEED, tasks: 400 });
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    todo.watch();
    await todo.load();
    const first = todo.state.items[0];
    if (!first) {
      throw new Error('expected a todo item');
    }
    const total = todo.state.total;
    lists.apply([{ ...first, rank: 'zzzzzz' }], []);
    expect(
      todo.state.items.some((item) => {
        return item.id === first.id;
      })
    ).toBe(false);
    expect(todo.state.total).toBe(total);
  });

  it('marks lists that nobody watches as stale instead of patching them', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const lists = new ItemLists(trekker.gateways().items);
    const todo = lists.get(todoQuery);
    await todo.load();
    const before = todo.state.items;
    const first = before[0];
    if (!first) {
      throw new Error('expected a todo item');
    }
    lists.apply([{ ...first, status: 'completed' }], []);
    expect(todo.state.items).toBe(before);
    const stop = todo.watch();
    await new Promise((resolve) => {
      return setTimeout(resolve, 0);
    });
    expect(
      todo.state.items.some((item) => {
        return item.id === first.id;
      })
    ).toBe(true);
    stop();
  });
});
