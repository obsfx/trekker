import dayjs from 'dayjs';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { Errors } from '@/ui/lib/errors.ts';
import type { Page } from '@/ui/lib/item-shapes.ts';

export interface PagedState<T> {
  status: 'idle' | 'loading' | 'ready' | 'failed';
  items: T[];
  total: number;
  nextCursor: string | null;
  loadingMore: boolean;
  error: Error | null;
}

export interface PagedChange<T> {
  items: T[];
  total: number;
}

export class PagedList<T> {
  readonly store: StoreApi<PagedState<T>>;
  private readonly fetchPage: (cursor: string | null) => Promise<Page<T>>;
  private readonly idOf: (item: T) => string;
  private ticket = 0;
  private watchers = 0;
  private stale = false;
  private pending: Promise<void> | null = null;
  private lastFetched: T | null = null;
  private lastSeenAt = dayjs().valueOf();

  constructor(fetchPage: (cursor: string | null) => Promise<Page<T>>, idOf: (item: T) => string) {
    this.fetchPage = fetchPage;
    this.idOf = idOf;
    this.store = createStore<PagedState<T>>()(() => {
      return PagedList.initialState<T>();
    });
  }

  private static initialState<T>(): PagedState<T> {
    return {
      status: 'idle',
      items: [],
      total: 0,
      nextCursor: null,
      loadingMore: false,
      error: null,
    };
  }

  get state() {
    return this.store.getState();
  }

  get watched() {
    return this.watchers > 0;
  }

  get boundary() {
    return this.lastFetched;
  }

  get idleSince() {
    if (this.watched) {
      return Number.POSITIVE_INFINITY;
    }
    return this.lastSeenAt;
  }

  load() {
    if (this.pending) {
      return this.pending;
    }
    if (this.state.status === 'ready') {
      return Promise.resolve();
    }
    this.pending = this.fetchFirst().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  watch() {
    this.watchers += 1;
    this.lastSeenAt = dayjs().valueOf();
    if (this.stale) {
      void this.reload();
    }
    return () => {
      this.watchers -= 1;
      this.lastSeenAt = dayjs().valueOf();
    };
  }

  invalidate() {
    if (this.state.status === 'idle') {
      return;
    }
    this.stale = true;
    if (this.watched) {
      void this.reload();
    }
  }

  async reload() {
    this.stale = false;
    await this.fetchFirst();
  }

  async refreshLoaded() {
    if (this.state.status !== 'ready') {
      await this.load();
      return;
    }
    const wanted = Math.max(this.state.items.length, 1);
    this.ticket += 1;
    const ticket = this.ticket;
    try {
      const items: T[] = [];
      const seen = new Set<string>();
      const collect = (rows: T[]) => {
        for (const row of rows) {
          const id = this.idOf(row);
          if (!seen.has(id)) {
            seen.add(id);
            items.push(row);
          }
        }
      };
      let page = await this.fetchPage(null);
      collect(page.items);
      while (page.nextCursor !== null && items.length < wanted) {
        page = await this.fetchPage(page.nextCursor);
        collect(page.items);
      }
      if (ticket !== this.ticket) {
        return;
      }
      this.stale = false;
      this.lastFetched = items.at(-1) ?? null;
      this.store.setState({ items, total: page.total, nextCursor: page.nextCursor, error: null });
    } catch (error) {
      if (ticket === this.ticket) {
        this.store.setState({ error: Errors.of(error) });
      }
    }
  }

  async loadMore() {
    const { nextCursor, loadingMore, status } = this.state;
    if (status !== 'ready' || nextCursor === null || loadingMore) {
      return;
    }
    const ticket = this.ticket;
    this.store.setState({ loadingMore: true });
    try {
      const page = await this.fetchPage(nextCursor);
      if (ticket !== this.ticket) {
        return;
      }
      const known = new Set(this.state.items.map(this.idOf));
      const fresh = page.items.filter((item) => {
        return !known.has(this.idOf(item));
      });
      this.lastFetched = page.items.at(-1) ?? this.lastFetched;
      this.store.setState({
        items: [...this.state.items, ...fresh],
        nextCursor: page.nextCursor,
        total: page.total,
        loadingMore: false,
      });
    } catch (error) {
      if (ticket === this.ticket) {
        this.store.setState({ loadingMore: false, error: Errors.of(error) });
      }
    }
  }

  patch(change: (current: PagedChange<T>) => PagedChange<T>) {
    if (this.state.status !== 'ready') {
      return;
    }
    const next = change({ items: this.state.items, total: this.state.total });
    this.store.setState({ items: next.items, total: Math.max(next.total, next.items.length) });
  }

  setTotal(total: number) {
    if (this.state.status === 'ready') {
      this.store.setState({ total: Math.max(total, this.state.items.length) });
    }
  }

  private async fetchFirst() {
    this.ticket += 1;
    const ticket = this.ticket;
    if (this.state.status !== 'ready') {
      this.store.setState({ status: 'loading', error: null });
    }
    try {
      const page = await this.fetchPage(null);
      if (ticket !== this.ticket) {
        return;
      }
      this.lastFetched = page.items.at(-1) ?? null;
      this.store.setState({
        status: 'ready',
        items: page.items,
        total: page.total,
        nextCursor: page.nextCursor,
        loadingMore: false,
        error: null,
      });
    } catch (error) {
      if (ticket !== this.ticket) {
        return;
      }
      if (this.state.status === 'ready') {
        this.store.setState({ error: Errors.of(error) });
        return;
      }
      this.store.setState({ status: 'failed', error: Errors.of(error) });
    }
  }
}
