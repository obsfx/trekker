import { vi } from 'vitest';

export class MemoryStorage implements Storage {
  private readonly values: Map<string, string>;

  constructor(entries: Record<string, string> = {}) {
    this.values = new Map(Object.entries(entries));
  }

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  static seeded(key: string, state: unknown) {
    const storage = new MemoryStorage({ [key]: JSON.stringify({ state, version: 0 }) });
    vi.resetModules();
    vi.stubGlobal('localStorage', storage);
    return storage;
  }
}
