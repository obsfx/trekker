import type { HistoryEntry } from '@/src/services/history';
import { HEARTBEAT_INTERVAL_MS, REPLAY_LIMIT } from '@/src/server/constants';
import type { EventFeed } from '@/src/server/event-feed';
import { DtoMappers } from '@/src/server/http/dto';
import type { StreamPositionDto } from '@/src/server/http/dto';
import { Requests } from '@/src/server/http/request';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import { eventsQuery, lastEventId } from '@/src/server/http/schemas';

export abstract class EventHandlers {
  private static controlMessage(
    event: 'ready' | 'reset',
    head: number,
    resumeFrom: number
  ): string {
    const data: StreamPositionDto = { lastEventId: head };
    return `event: ${event}\nid: ${resumeFrom}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  private static readonly eventMessage = (event: HistoryEntry): string => {
    return `id: ${event.id}\ndata: ${JSON.stringify(DtoMappers.renderHistoryEvent(event))}\n\n`;
  };

  private static resumePoint({ request, url }: RouteContext): number | null {
    const header = request.headers.get('last-event-id');
    if (header !== null && header.trim() !== '') {
      return Requests.parseWith(lastEventId, header.trim());
    }
    return Requests.parseQuery(url, eventsQuery).after ?? null;
  }

  private static missedEvents(feed: EventFeed, after: number, head: number): HistoryEntry[] | null {
    if (after > head) {
      return null;
    }
    const events = feed.after(after, REPLAY_LIMIT + 1).filter((event) => {
      return event.id <= head;
    });
    if (events.length > REPLAY_LIMIT) {
      return null;
    }
    return events;
  }

  private static openingMessages(feed: EventFeed, after: number | null, head: number): string {
    if (after === null) {
      return EventHandlers.controlMessage('ready', head, head);
    }
    const missed = EventHandlers.missedEvents(feed, after, head);
    if (missed === null) {
      return (
        EventHandlers.controlMessage('ready', head, head) +
        EventHandlers.controlMessage('reset', head, head)
      );
    }
    return (
      EventHandlers.controlMessage('ready', head, after) +
      missed.map(EventHandlers.eventMessage).join('')
    );
  }

  static eventRoutes(
    feed: EventFeed,
    heartbeatIntervalMs: number = HEARTBEAT_INTERVAL_MS
  ): RouteTable {
    function streamEvents(context: RouteContext): Response {
      const after = EventHandlers.resumePoint(context);
      context.server.timeout(context.request, 0);

      let release: (() => void) | null = null;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          let lastSent = 0;
          let heartbeat: ReturnType<typeof setInterval> | null = null;
          let unsubscribe: (() => void) | null = null;

          function close(): void {
            if (heartbeat !== null) {
              clearInterval(heartbeat);
              heartbeat = null;
            }
            if (unsubscribe !== null) {
              unsubscribe();
              unsubscribe = null;
            }
          }

          function write(text: string): void {
            try {
              controller.enqueue(encoder.encode(text));
            } catch {
              close();
            }
          }

          function send(events: readonly HistoryEntry[]): void {
            const fresh = events.filter((event) => {
              return event.id > lastSent;
            });
            const last = fresh.at(-1);
            if (!last) {
              return;
            }
            lastSent = last.id;
            write(fresh.map(EventHandlers.eventMessage).join(''));
          }

          unsubscribe = feed.subscribe(send);
          release = close;
          try {
            const head = feed.latestId();
            lastSent = head;
            write(EventHandlers.openingMessages(feed, after, head));
          } catch (error) {
            close();
            controller.error(error);
            return;
          }
          heartbeat = setInterval(() => {
            write(': ping\n\n');
          }, heartbeatIntervalMs);
          context.request.signal.addEventListener('abort', close, { once: true });
        },
        cancel() {
          release?.();
        },
      });

      return new Response(stream, { headers: SSE_HEADERS });
    }

    return {
      '/api/events': { GET: streamEvents },
    };
  }
}

const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-store',
  connection: 'keep-alive',
  'x-accel-buffering': 'no',
};

const encoder = new TextEncoder();
