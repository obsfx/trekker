import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryStorage } from '@/ui/tests/support/persisted-store.ts';

const KEY = 'trekker.preferences';

abstract class StoreFixture {
  static async loadStore() {
    const { usePreferencesStore } = await import('@/ui/store/preferences-store.ts');
    return usePreferencesStore;
  }
}

describe('usePreferencesStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores persisted preferences with a trimmed author', async () => {
    MemoryStorage.seeded(KEY, { theme: 'dark', author: '  ada  ', notifications: true });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.theme).toBe('dark');
    expect(state.author).toBe('ada');
    expect(state.notifications).toBe(true);
  });

  it('falls back per field when persisted values are invalid', async () => {
    MemoryStorage.seeded(KEY, { theme: 'neon', author: '   ', notifications: 'yes' });
    const store = await StoreFixture.loadStore();
    const state = store.getState();
    expect(state.theme).toBe('system');
    expect(state.author).toBe('user');
    expect(state.notifications).toBe(false);
  });
});
