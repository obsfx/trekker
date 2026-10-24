import type { HistoryEntry } from '@/src/services/history';
import { FEED_BATCH_SIZE, FEED_INTERVAL_MS } from '@/src/server/constants';

export interface EventLog {
  latestId: () => number;
  after: (id: number, limit: number) => HistoryEntry[];
  dataVersion: () => number;
}

export type EventListener = (events: readonly HistoryEntry[]) => void;

interface Subscription {
  listener: EventListener;
}

export class EventFeed {
  private readonly subscriptions = new Set<Subscription>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastId = 0;
  private lastVersion = 0;

  constructor(
    private readonly log: EventLog,
    private readonly intervalMs: number = FEED_INTERVAL_MS
  ) {}

  get running(): boolean {
    return this.timer !== null;
  }

  latestId(): number {
    return this.log.latestId();
  }

  after(id: number, limit: number): HistoryEntry[] {
    return this.log.after(id, limit);
  }

  subscribe(listener: EventListener): () => void {
    const subscription: Subscription = { listener };
    this.subscriptions.add(subscription);
    if (this.timer === null) {
      this.start();
    }
    return () => {
      this.subscriptions.delete(subscription);
      if (this.subscriptions.size === 0) {
        this.stop();
      }
    };
  }

  poke(): void {
    if (this.timer === null) {
      return;
    }
    try {
      this.publishNew();
    } catch (error) {
      console.error('trekker serve: event feed poke failed', error);
    }
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private start(): void {
    this.lastId = this.log.latestId();
    this.lastVersion = this.log.dataVersion();
    this.timer = setInterval(() => {
      this.check();
    }, this.intervalMs);
  }

  private check(): void {
    try {
      const version = this.log.dataVersion();
      if (version === this.lastVersion) {
        return;
      }
      this.lastVersion = version;
      this.publishNew();
    } catch (error) {
      console.error('trekker serve: event feed check failed', error);
    }
  }

  private publishNew(): void {
    for (;;) {
      const events = this.log.after(this.lastId, FEED_BATCH_SIZE);
      const last = events.at(-1);
      if (!last) {
        return;
      }
      this.lastId = last.id;
      this.broadcast(events);
      if (events.length < FEED_BATCH_SIZE) {
        return;
      }
    }
  }

  private broadcast(events: readonly HistoryEntry[]): void {
    for (const { listener } of this.subscriptions) {
      try {
        listener(events);
      } catch (error) {
        console.error('trekker serve: event listener failed', error);
      }
    }
  }
}
