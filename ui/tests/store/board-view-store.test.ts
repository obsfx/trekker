import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { MemoryStorage } from '@/ui/tests/support/persisted-store.ts';

const KEY = 'trekker.board';

abstract class StoreFixture {
  static async loadStore() {
    const { useBoardViewStore } = await import('@/ui/store/board-view-store.ts');
    return useBoardViewStore;
  }
}

describe('useBoardViewStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores the persisted board view', async () => {
    MemoryStorage.seeded(KEY, {
      kind: 'epic',
      epicId: 'EPIC-3',
      sort: { field: 'priority', direction: 'desc' },
    });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.kind).toBe('epic');
    expect(state.epicId).toBe('EPIC-3');
    expect(state.sort).toEqual({ field: 'priority', direction: 'desc' });
  });

  it('falls back to the manual order when the persisted view is invalid', async () => {
    MemoryStorage.seeded(KEY, { kind: 'subtask', epicId: [], sort: { field: 'votes' } });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.kind).toBe('all');
    expect(state.epicId).toBeNull();
    expect(state.sort).toEqual(ItemQueries.manualSort);
  });
});
