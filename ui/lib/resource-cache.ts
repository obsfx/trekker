import { AsyncResource } from '@/ui/lib/async-resource.ts';

export class ResourceCache<T> {
  private static readonly maxIdleEntries = 60;

  private readonly entries = new Map<string, AsyncResource<T>>();
  private readonly fetcher: (key: string) => Promise<T>;

  constructor(fetcher: (key: string) => Promise<T>) {
    this.fetcher = fetcher;
  }

  get(key: string) {
    const existing = this.entries.get(key);
    if (existing) {
      this.entries.delete(key);
      this.entries.set(key, existing);
      return existing;
    }
    const resource = new AsyncResource(() => {
      return this.fetcher(key);
    });
    this.entries.set(key, resource);
    this.evictIdle();
    return resource;
  }

  peek(key: string) {
    return this.entries.get(key) ?? null;
  }

  invalidate(key: string) {
    this.entries.get(key)?.invalidate();
  }

  invalidateAll() {
    for (const resource of this.entries.values()) {
      resource.invalidate();
    }
  }

  forget(key: string) {
    this.entries.delete(key);
  }

  private evictIdle() {
    const idle = [...this.entries.entries()].filter(([, resource]) => {
      return !resource.watched;
    });
    const excess = idle.length - ResourceCache.maxIdleEntries;
    for (const [key] of idle.slice(0, Math.max(excess, 0))) {
      this.entries.delete(key);
    }
  }
}
