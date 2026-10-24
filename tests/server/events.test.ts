import dayjs from 'dayjs';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { join } from 'node:path';
import { EventFeed, type EventLog } from '@/src/server/event-feed';
import { EventHandlers } from '@/src/server/http/event-routes';
import type { RouteContext } from '@/src/server/http/route';
import type { HistoryEntry } from '@/src/services/history';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { DB_RELATIVE_PATH, TestTarget } from '@/tests/helpers/workspace';
import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import { SseReader, type SseMessage } from '@/tests/helpers/sse';
import type { Identified } from '@/tests/helpers/shapes';

abstract class EventsFixture {
  static wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      return setTimeout(resolve, ms);
    });
  }

  static context(url: string, headers: Record<string, string> = {}): RouteContext {
    const request = new Request(url, { headers });
    return {
      request,
      url: new URL(url),
      params: {},
      server: {
        timeout: (_request, seconds) => {
          idleTimeouts.push(seconds);
        },
      },
    };
  }

  static readonly ignoreEvents = (events: readonly HistoryEntry[]): number => {
    return events.length;
  };

  static streamOf(
    feed: EventFeed,
    url: string,
    headers: Record<string, string> = {},
    heartbeatMs = 60_000
  ) {
    const handler = EventHandlers.eventRoutes(feed, heartbeatMs)['/api/events'].GET;
    if (!handler) {
      throw new Error('missing events route');
    }
    const response = handler(EventsFixture.context(url, headers));
    if (response instanceof Promise) {
      throw new TypeError('events route must respond synchronously');
    }
    if (!response.body) {
      throw new Error('events route returned no body');
    }
    return { response, reader: new SseReader(response.body) };
  }

  static eventIds(messages: SseMessage[]): number[] {
    return messages.map((message) => {
      return Number(message.id);
    });
  }

  static async readMessages(reader: SseReader, count: number): Promise<SseMessage[]> {
    const messages: SseMessage[] = [];
    for (let index = 0; index < count; index++) {
      const message = await reader.next();
      messages.push(message);
    }
    return messages;
  }
}

class MemoryEventLog implements EventLog {
  events: HistoryEntry[] = [];
  version = 1;
  afterCalls = 0;

  append(count: number, commit = true): void {
    for (let index = 0; index < count; index++) {
      const id = this.latestId() + 1;
      this.events.push({
        id,
        action: 'create',
        entityType: 'task',
        entityId: `TREK-${id}`,
        taskId: `TREK-${id}`,
        title: `Task ${id}`,
        relatedIds: [],
        snapshot: { id: `TREK-${id}`, parent_task_id: null },
        changes: null,
        timestamp: dayjs(id * 1000).toDate(),
      });
    }
    if (commit) {
      this.version += 1;
    }
  }

  latestId(): number {
    return this.events.at(-1)?.id ?? 0;
  }

  after(id: number, limit: number): HistoryEntry[] {
    this.afterCalls += 1;
    return this.events
      .filter((event) => {
        return event.id > id;
      })
      .slice(0, limit);
  }

  dataVersion(): number {
    return this.version;
  }
}

const FAST_INTERVAL_MS = 5;

const idleTimeouts: number[] = [];

describe('EventFeed', () => {
  let log: MemoryEventLog;
  let feed: EventFeed;

  beforeEach(() => {
    log = new MemoryEventLog();
    log.append(3);
    feed = new EventFeed(log, FAST_INTERVAL_MS);
  });

  afterEach(() => {
    feed.stop();
  });

  it('runs its timer only while someone listens', () => {
    expect(feed.running).toBe(false);
    const unsubscribeFirst = feed.subscribe(EventsFixture.ignoreEvents);
    const unsubscribeSecond = feed.subscribe(EventsFixture.ignoreEvents);
    expect(feed.running).toBe(true);
    unsubscribeFirst();
    expect(feed.running).toBe(true);
    unsubscribeSecond();
    expect(feed.running).toBe(false);
  });

  it('broadcasts only rows committed after it started', async () => {
    const first: number[] = [];
    const second: number[] = [];
    feed.subscribe((events) => {
      return first.push(
        ...events.map((event) => {
          return event.id;
        })
      );
    });
    feed.subscribe((events) => {
      return second.push(
        ...events.map((event) => {
          return event.id;
        })
      );
    });

    log.append(2);
    await EventsFixture.wait(FAST_INTERVAL_MS * 6);

    expect(first).toEqual([4, 5]);
    expect(second).toEqual([4, 5]);
  });

  it('skips the events query while data_version is unchanged', async () => {
    feed.subscribe(EventsFixture.ignoreEvents);
    const calls = log.afterCalls;
    await EventsFixture.wait(FAST_INTERVAL_MS * 6);
    expect(log.afterCalls).toBe(calls);
  });

  it('reads its own commits on poke', () => {
    const received: number[] = [];
    feed.subscribe((events) => {
      return received.push(
        ...events.map((event) => {
          return event.id;
        })
      );
    });
    log.append(1, false);
    feed.poke();
    expect(received).toEqual([4]);
  });

  it('drains large bursts in batches', async () => {
    const received: number[] = [];
    feed.subscribe((events) => {
      return received.push(
        ...events.map((event) => {
          return event.id;
        })
      );
    });
    log.append(1203);
    await EventsFixture.wait(FAST_INTERVAL_MS * 6);
    expect(received).toHaveLength(1203);
    expect(received.at(-1)).toBe(1206);
  });

  it('keeps broadcasting when a listener throws', () => {
    const received: number[] = [];
    const originalError = console.error;
    const logged: unknown[] = [];
    console.error = (...args: unknown[]) => {
      logged.push(args);
    };
    try {
      feed.subscribe(() => {
        throw new Error('broken client');
      });
      feed.subscribe((events) => {
        return received.push(
          ...events.map((event) => {
            return event.id;
          })
        );
      });
      log.append(1, false);
      feed.poke();
    } finally {
      console.error = originalError;
    }
    expect(received).toEqual([4]);
    expect(logged).toHaveLength(1);
  });
});

describe('GET /api/events stream', () => {
  let log: MemoryEventLog;
  let feed: EventFeed;

  beforeEach(() => {
    log = new MemoryEventLog();
    log.append(10);
    feed = new EventFeed(log, FAST_INTERVAL_MS);
  });

  afterEach(() => {
    feed.stop();
  });

  it('starts with ready and then streams new rows', async () => {
    idleTimeouts.length = 0;
    const { response, reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events');
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(idleTimeouts).toEqual([0]);

    const ready = await reader.next();
    expect(ready.event).toBe('ready');
    expect(ready.id).toBe('10');
    expect(JSON.parse(ready.data)).toEqual({ lastEventId: 10 });

    log.append(2);
    const messages = await EventsFixture.readMessages(reader, 2);
    expect(EventsFixture.eventIds(messages)).toEqual([11, 12]);
    expect(JSON.parse(messages[0].data)).toEqual({
      id: 11,
      relatedIds: [],
      action: 'create',
      entityType: 'task',
      entityId: 'TREK-11',
      taskId: 'TREK-11',
      title: 'Task 11',
      snapshot: { id: 'TREK-11', parentTaskId: null },
      changes: null,
      createdAt: 11_000,
    });
    await reader.close();
  });

  it('replays rows after ?after before live rows', async () => {
    const { reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events?after=7');
    const ready = await reader.next();
    expect(ready.event).toBe('ready');
    expect(ready.id).toBe('7');
    expect(JSON.parse(ready.data)).toEqual({ lastEventId: 10 });
    const messages = await EventsFixture.readMessages(reader, 3);
    expect(EventsFixture.eventIds(messages)).toEqual([8, 9, 10]);

    log.append(1);
    const appended = await EventsFixture.readMessages(reader, 1);
    expect(EventsFixture.eventIds(appended)).toEqual([11]);
    await reader.close();
  });

  it('prefers the Last-Event-ID header over ?after', async () => {
    const { reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events?after=2', {
      'Last-Event-ID': '9',
    });
    await reader.next();
    const messages = await EventsFixture.readMessages(reader, 1);
    expect(EventsFixture.eventIds(messages)).toEqual([10]);
    log.append(1);
    const appended = await EventsFixture.readMessages(reader, 1);
    expect(EventsFixture.eventIds(appended)).toEqual([11]);
    await reader.close();
  });

  it('sends reset when the client is ahead of the log', async () => {
    const { reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events?after=50');
    const message = await reader.next();
    expect(message.event).toBe('ready');
    const reset = await reader.next();
    expect(reset.event).toBe('reset');
    expect(JSON.parse(reset.data)).toEqual({ lastEventId: 10 });
    await reader.close();
  });

  it('sends reset instead of replaying more than the replay limit', async () => {
    log.append(2100);
    const { reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events?after=1');
    const opening = await reader.next();
    expect(opening.event).toBe('ready');
    const reset = await reader.next();
    expect(reset.event).toBe('reset');
    log.append(1);
    const messages = await EventsFixture.readMessages(reader, 1);
    expect(EventsFixture.eventIds(messages)).toEqual([2111]);
    await reader.close();
  });

  it('sends a heartbeat comment', async () => {
    const { reader } = EventsFixture.streamOf(
      feed,
      'http://localhost/api/events',
      {},
      FAST_INTERVAL_MS
    );
    await reader.next();
    const ping = await reader.next();
    expect(ping).toEqual({ event: 'comment', id: null, data: 'ping' });
    await reader.close();
  });

  it('unsubscribes from the feed when the client goes away', async () => {
    const { reader } = EventsFixture.streamOf(feed, 'http://localhost/api/events');
    await reader.next();
    expect(feed.running).toBe(true);
    await reader.close();
    expect(feed.running).toBe(false);
  });

  it('rejects an invalid resume point', () => {
    const handler = EventHandlers.eventRoutes(feed)['/api/events'].GET;
    expect(() => {
      return handler?.(EventsFixture.context('http://localhost/api/events?after=abc'));
    }).toThrow('after must be a non-negative integer');
  });
});

describe.skipIf(TestTarget.isContainer)('event stream from a running server', () => {
  let ctx: TestContext;
  let server: ServeHandle;

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  it('delivers a change made by another trekker process', async () => {
    const reader = await SseReader.open(`${server.url}/api/events`);
    const ready = await reader.next();
    expect(ready.event).toBe('ready');

    ctx.run('task create -t "From the CLI"');
    const message = await reader.until((candidate) => {
      return candidate.event === 'message';
    });
    const event = JSON.parse(message.data);
    expect(event.action).toBe('create');
    expect(event.entityType).toBe('task');
    expect(event.snapshot.title).toBe('From the CLI');
    expect(Number(message.id)).toBe(event.id);
    await reader.close();
  });

  it('delivers the server own writes without waiting for data_version', async () => {
    const reader = await SseReader.open(`${server.url}/api/events`);
    await reader.next();
    const created = await server.json<Identified>(
      '/api/epics',
      ServeHelpers.jsonInit('POST', { title: 'From the API' })
    );
    const message = await reader.until((candidate) => {
      return candidate.event === 'message';
    });
    expect(JSON.parse(message.data).entityId).toBe(created.body.id);
    await reader.close();
  });

  it('replays missed rows with ?after and Last-Event-ID', async () => {
    const before = await SseReader.open(`${server.url}/api/events`);
    const opening = await before.next();
    const ready = JSON.parse(opening.data);
    await before.close();

    ctx.run('epic create -t "Missed one"');
    ctx.run('epic create -t "Missed two"');

    const replay = await SseReader.open(`${server.url}/api/events?after=${ready.lastEventId}`);
    const replayStart = await replay.next();
    expect(replayStart.event).toBe('ready');
    const firstMissed = await replay.next();
    const secondMissed = await replay.next();
    const missed = [firstMissed, secondMissed].map((message) => {
      return JSON.parse(message.data);
    });
    expect(
      missed.map((event) => {
        return event.snapshot.title;
      })
    ).toEqual(['Missed one', 'Missed two']);
    await replay.close();

    const resumed = await SseReader.open(`${server.url}/api/events`, {
      'Last-Event-ID': String(ready.lastEventId + 1),
    });
    await resumed.next();
    const resumedEvent = await resumed.next();
    expect(JSON.parse(resumedEvent.data).snapshot.title).toBe('Missed two');
    await resumed.close();
  });

  it('sends reset when more rows were missed than it replays', async () => {
    const before = await SseReader.open(`${server.url}/api/events`);
    const message = await before.next();
    const ready = JSON.parse(message.data);
    await before.close();

    const db = new Database(join(ctx.cwd, DB_RELATIVE_PATH));
    try {
      const insert = db.query(
        "INSERT INTO events (action, entity_type, entity_id, created_at) VALUES ('update', 'task', 'TREK-1', 0)"
      );
      db.transaction(() => {
        for (let index = 0; index < 2001; index++) {
          insert.run();
        }
      })();
    } finally {
      db.close();
    }

    const reader = await SseReader.open(`${server.url}/api/events?after=${ready.lastEventId}`);
    const readerStart = await reader.next();
    expect(readerStart.event).toBe('ready');
    const reset = await reader.next();
    expect(reset.event).toBe('reset');
    await reader.close();
  });
});
