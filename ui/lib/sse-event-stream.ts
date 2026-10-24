import * as v from 'valibot';
import { createStore } from 'zustand/vanilla';

import { HistoryShapes } from '@/ui/lib/history-shapes.ts';
import type {
  EventStream,
  LiveState,
  LiveStatus,
  StreamListener,
  StreamSignal,
} from '@/ui/lib/server-events.ts';
import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

export class SseEventStream implements EventStream {
  private static readonly initialRetryMs = 1000;
  private static readonly maxRetryMs = 15_000;
  private static readonly readyTimeoutMs = 1500;
  private static readonly readyMessage = v.object({ lastEventId: ValueSchemas.count });

  readonly status = createStore<LiveStatus>()(() => {
    return { state: 'connecting' };
  });

  private readonly url: string;
  private readonly listeners = new Set<StreamListener>();
  private source: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = SseEventStream.initialRetryMs;
  private lastEventId: number | null = null;
  private connectedBefore = false;
  private readonly firstReady: Promise<void>;
  private resolveFirstReady: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    this.firstReady = new Promise((resolve) => {
      this.resolveFirstReady = resolve;
    });
  }

  private static parseJson(raw: unknown): unknown {
    if (typeof raw !== 'string') {
      return null;
    }
    try {
      const value: unknown = JSON.parse(raw);
      return value;
    } catch {
      return null;
    }
  }

  ready() {
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, SseEventStream.readyTimeoutMs);
    });
    return Promise.race([this.firstReady, timeout]);
  }

  subscribe(listener: StreamListener) {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect() {
    const url = new URL(this.url, window.location.origin);
    if (this.lastEventId !== null) {
      url.searchParams.set('after', String(this.lastEventId));
    }
    this.setState('connecting');
    const source = new EventSource(url);
    source.addEventListener('open', () => {
      this.retryDelay = SseEventStream.initialRetryMs;
      this.setState('live');
    });
    source.addEventListener('ready', (message) => {
      this.receiveReady(message.data);
    });
    source.addEventListener('reset', (message) => {
      this.receiveReset(message.data);
    });
    source.addEventListener('message', (message) => {
      this.receiveEvent(message.data);
    });
    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        this.handleClosed(source);
        return;
      }
      this.setState('connecting');
    });
    this.source = source;
  }

  private receiveReady(raw: unknown) {
    const parsed = v.safeParse(SseEventStream.readyMessage, SseEventStream.parseJson(raw));
    if (!parsed.success) {
      return;
    }
    if (this.connectedBefore && this.lastEventId === null) {
      this.emit({ kind: 'reset' });
    }
    this.connectedBefore = true;
    this.resolveFirstReady?.();
    this.lastEventId ??= parsed.output.lastEventId;
  }

  private receiveReset(raw: unknown) {
    const parsed = v.safeParse(SseEventStream.readyMessage, SseEventStream.parseJson(raw));
    if (parsed.success) {
      this.lastEventId = parsed.output.lastEventId;
    }
    this.emit({ kind: 'reset' });
  }

  private receiveEvent(raw: unknown) {
    const event = HistoryShapes.parse(SseEventStream.parseJson(raw));
    if (!event) {
      return;
    }
    if (this.lastEventId === null || event.id > this.lastEventId) {
      this.lastEventId = event.id;
    }
    this.emit({ kind: 'event', event });
  }

  private handleClosed(source: EventSource) {
    if (this.source !== source) {
      return;
    }
    this.source = null;
    this.setState('offline');
    if (this.listeners.size === 0) {
      return;
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, SseEventStream.maxRetryMs);
  }

  private emit(signal: StreamSignal) {
    for (const listener of this.listeners) {
      listener(signal);
    }
  }

  private setState(state: LiveState) {
    if (this.status.getState().state !== state) {
      this.status.setState({ state });
    }
  }

  private disconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.source?.close();
    this.source = null;
  }
}
