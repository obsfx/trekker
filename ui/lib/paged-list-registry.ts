import type { Page } from '@/ui/lib/item-shapes.ts';
import { PagedList } from '@/ui/lib/paged-list.ts';

interface RegistryEntry<Q, T> {
  query: Q;
  list: PagedList<T>;
}

export class PagedListRegistry<Q, T> {
  private static readonly maxIdleLists = 24;

  private readonly entries = new Map<string, RegistryEntry<Q, T>>();
  private readonly keyOf: (query: Q) => string;
  private readonly fetchPage: (query: Q, cursor: string | null) => Promise<Page<T>>;
  private readonly idOf: (item: T) => string;

  constructor(
    keyOf: (query: Q) => string,
    fetchPage: (query: Q, cursor: string | null) => Promise<Page<T>>,
    idOf: (item: T) => string
  ) {
    this.keyOf = keyOf;
    this.fetchPage = fetchPage;
    this.idOf = idOf;
  }

  get(query: Q) {
    const key = this.keyOf(query);
    const existing = this.entries.get(key);
    if (existing) {
      return existing.list;
    }
    const list = new PagedList<T>((cursor) => {
      return this.fetchPage(query, cursor);
    }, this.idOf);
    this.entries.set(key, { query, list });
    this.evictIdle();
    return list;
  }

  all() {
    return [...this.entries.values()];
  }

  invalidateAll() {
    for (const { list } of this.entries.values()) {
      list.invalidate();
    }
  }

  private evictIdle() {
    const idle = [...this.entries.entries()]
      .filter(([, entry]) => {
        return !entry.list.watched;
      })
      .sort(([, left], [, right]) => {
        return left.list.idleSince - right.list.idleSince;
      });
    const excess = idle.length - PagedListRegistry.maxIdleLists;
    for (const [key] of idle.slice(0, Math.max(excess, 0))) {
      this.entries.delete(key);
    }
  }
}
