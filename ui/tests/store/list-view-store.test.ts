import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { MemoryStorage } from '@/ui/tests/support/persisted-store.ts';

const KEY = 'trekker.list';

abstract class StoreFixture {
  static async loadStore() {
    const { useListViewStore } = await import('@/ui/store/list-view-store.ts');
    return useListViewStore;
  }
}

describe('useListViewStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores valid persisted filters', async () => {
    MemoryStorage.seeded(KEY, {
      types: ['task'],
      statuses: ['in_progress'],
      priorities: [1],
      epicId: 'EPIC-1',
      dateFilter: { field: 'updated', preset: 'week', from: null, to: null },
      sort: { field: 'title', direction: 'asc' },
    });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.types).toEqual(['task']);
    expect(state.statuses).toEqual(['in_progress']);
    expect(state.priorities).toEqual([1]);
    expect(state.epicId).toBe('EPIC-1');
    expect(state.dateFilter).toEqual({ field: 'updated', preset: 'week', from: null, to: null });
    expect(state.sort).toEqual({ field: 'title', direction: 'asc' });
  });

  it('replaces invalid persisted fields with defaults and keeps the valid ones', async () => {
    MemoryStorage.seeded(KEY, {
      types: ['story'],
      statuses: 'todo',
      priorities: [9],
      epicId: 42,
      dateFilter: { field: 'birthday', preset: 'forever' },
      sort: { field: 'title', direction: 'asc' },
    });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.types).toEqual([]);
    expect(state.statuses).toEqual([]);
    expect(state.priorities).toEqual([]);
    expect(state.epicId).toBeNull();
    expect(state.dateFilter).toBeNull();
    expect(state.sort).toEqual({ field: 'title', direction: 'asc' });
  });

  it('ignores persisted state that is not an object', async () => {
    MemoryStorage.seeded(KEY, 'broken');
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.types).toEqual([]);
    expect(state.sort).toEqual(ItemQueries.recentSort);
  });

  it('toggles a filter value and persists the change', async () => {
    const storage = MemoryStorage.seeded(KEY, {});
    const store = await StoreFixture.loadStore();
    store.getState().toggleStatus('todo');
    store.getState().toggleStatus('completed');
    store.getState().toggleStatus('todo');
    expect(store.getState().statuses).toEqual(['completed']);
    expect(storage.getItem(KEY)).toContain('"statuses":["completed"]');
  });
});
