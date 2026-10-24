import { createStore, type StoreApi } from 'zustand/vanilla';

import { Errors } from '@/ui/lib/errors.ts';

interface IdleResource {
  status: 'idle';
}

interface LoadingResource {
  status: 'loading';
}

interface ReadyResource<T> {
  status: 'ready';
  data: T;
}

interface FailedResource {
  status: 'failed';
  error: Error;
}

export type ResourceState<T> = IdleResource | LoadingResource | ReadyResource<T> | FailedResource;

export abstract class ResourceStates {
  static dataOr<T, F>(state: ResourceState<T>, fallback: F): T | F {
    if (state.status === 'ready') {
      return state.data;
    }
    return fallback;
  }
}

export class AsyncResource<T> {
  readonly store: StoreApi<ResourceState<T>>;
  private readonly fetcher: () => Promise<T>;
  private pending: Promise<void> | null = null;
  private refreshing: Promise<void> | null = null;
  private dirty = false;
  private watchers = 0;
  private stale = false;
  private refreshTicket = 0;

  constructor(fetcher: () => Promise<T>) {
    this.fetcher = fetcher;
    this.store = createStore<ResourceState<T>>()(() => {
      return { status: 'idle' };
    });
  }

  get watched() {
    return this.watchers > 0;
  }

  load() {
    if (this.pending) {
      return this.pending;
    }
    if (this.store.getState().status === 'ready') {
      return Promise.resolve();
    }
    this.store.setState({ status: 'loading' }, true);
    this.pending = this.fetcher()
      .then(
        (data) => {
          this.store.setState({ status: 'ready', data }, true);
        },
        (error: unknown) => {
          this.store.setState({ status: 'failed', error: Errors.of(error) }, true);
        }
      )
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }

  watch() {
    this.watchers += 1;
    if (this.stale) {
      void this.refresh();
    }
    return () => {
      this.watchers -= 1;
    };
  }

  invalidate() {
    if (this.store.getState().status === 'idle') {
      return;
    }
    this.stale = true;
    if (this.watchers > 0) {
      void this.refresh();
    }
  }

  update(change: (data: T) => T) {
    const state = this.store.getState();
    if (state.status !== 'ready') {
      return;
    }
    this.store.setState({ status: 'ready', data: change(state.data) }, true);
    if (this.refreshing) {
      this.refreshTicket += 1;
      void this.refresh();
    }
  }

  refresh() {
    if (this.refreshing) {
      this.dirty = true;
      return this.refreshing;
    }
    this.refreshing = this.refreshWhileDirty();
    return this.refreshing;
  }

  reload() {
    if (this.pending) {
      return this.pending;
    }
    this.store.setState({ status: 'idle' }, true);
    return this.load();
  }

  private async refreshWhileDirty() {
    try {
      let again = true;
      while (again) {
        this.dirty = false;
        await this.refreshOnce();
        again = this.needsAnotherRefresh();
      }
    } finally {
      this.refreshing = null;
    }
  }

  private needsAnotherRefresh() {
    return this.dirty;
  }

  private async refreshOnce() {
    if (this.pending) {
      await this.pending;
    }
    if (this.store.getState().status === 'idle') {
      return;
    }
    this.refreshTicket += 1;
    const ticket = this.refreshTicket;
    try {
      const data = await this.fetcher();
      if (ticket === this.refreshTicket) {
        this.stale = false;
        this.store.setState({ status: 'ready', data }, true);
      }
    } catch (error) {
      if (ticket === this.refreshTicket && this.store.getState().status !== 'ready') {
        this.store.setState({ status: 'failed', error: Errors.of(error) }, true);
      }
    }
  }
}
