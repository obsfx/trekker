import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryStorage } from '@/ui/tests/support/persisted-store.ts';

const KEY = 'trekker.history';

abstract class StoreFixture {
  static async loadStore() {
    const { useHistoryViewStore } = await import('@/ui/store/history-view-store.ts');
    return useHistoryViewStore;
  }
}

describe('useHistoryViewStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores persisted history filters', async () => {
    MemoryStorage.seeded(KEY, {
      types: ['task', 'comment'],
      actions: ['delete'],
      dateFilter: { field: 'created', preset: 'today', from: null, to: null },
    });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.types).toEqual(['task', 'comment']);
    expect(state.actions).toEqual(['delete']);
    expect(state.dateFilter?.preset).toBe('today');
  });

  it('drops unknown entity types and actions', async () => {
    MemoryStorage.seeded(KEY, { types: ['planet'], actions: ['explode'], dateFilter: 7 });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.types).toEqual([]);
    expect(state.actions).toEqual([]);
    expect(state.dateFilter).toBeNull();
  });

  it('clears selected actions', async () => {
    MemoryStorage.seeded(KEY, { actions: ['create', 'update'] });
    const store = await StoreFixture.loadStore();
    store.getState().toggleAction('create');
    expect(store.getState().actions).toEqual(['update']);
    store.getState().clearActions();
    expect(store.getState().actions).toEqual([]);
  });
});
