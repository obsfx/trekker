import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryTrekker } from '@/ui/lib/in-memory-trekker.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { Services } from '@/ui/lib/services.ts';

const SMALL_SEED = { epics: 2, tasks: 40, subtasksPerTask: 0, comments: 0, events: 0 };

describe('ServerEventSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('patches loaded lists after a batch of events', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const services = new Services(trekker.gateways(), { error: vi.fn(), info: vi.fn() });
    const todo = services.lists.get({
      ...ItemQueries.empty(ItemQueries.manualSort),
      statuses: ['todo'],
    });
    todo.watch();
    await todo.load();
    const stop = services.serverSync.start();
    const created = trekker.createTask({
      title: 'From an agent',
      description: null,
      priority: 0,
      status: 'todo',
      epicId: null,
      parentTaskId: null,
      tags: [],
    });
    await vi.runAllTimersAsync();
    expect(todo.state.items[0]?.id).toBe(created.id);
    trekker.removeItem(created.id);
    await vi.runAllTimersAsync();
    expect(
      todo.state.items.some((item) => {
        return item.id === created.id;
      })
    ).toBe(false);
    stop();
  });

  it('prepends new events to loaded history feeds', async () => {
    const trekker = new InMemoryTrekker(SMALL_SEED);
    const services = new Services(trekker.gateways(), { error: vi.fn(), info: vi.fn() });
    const feed = services.history.get({ types: [], actions: [], entityId: null });
    feed.watch();
    await feed.load();
    const stop = services.serverSync.start();
    trekker.createEpic({ title: 'Live epic', description: null, priority: 2, status: 'todo' });
    await vi.runAllTimersAsync();
    expect(feed.state.items[0]?.title).toBe('Live epic');
    stop();
  });

  it('refreshes the parent of a changed subtask', async () => {
    const trekker = new InMemoryTrekker({
      epics: 1,
      tasks: 8,
      subtasksPerTask: 2,
      comments: 0,
      events: 0,
    });
    const services = new Services(trekker.gateways(), { error: vi.fn(), info: vi.fn() });
    const subtask = [...trekker.items.values()].find((item) => {
      return item.kind === 'subtask' && item.status !== 'completed';
    });
    if (!subtask?.parent) {
      throw new Error('expected an open subtask');
    }
    const parentId = subtask.parent.id;
    const list = services.lists.get({
      ...ItemQueries.empty(ItemQueries.manualSort),
      statuses: [trekker.find(parentId).status],
    });
    list.watch();
    await list.load();
    const before =
      list.state.items.find((item) => {
        return item.id === parentId;
      })?.subtasks.done ?? -1;
    const stop = services.serverSync.start();
    trekker.updateItem(subtask.id, { status: 'completed' });
    await vi.runAllTimersAsync();
    expect(
      list.state.items.find((item) => {
        return item.id === parentId;
      })?.subtasks.done
    ).toBe(before + 1);
    stop();
  });
});
