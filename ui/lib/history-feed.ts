import type { HistoryGateway } from '@/ui/lib/gateways.ts';
import { type HistoryEvent, type HistoryQuery, HistoryShapes } from '@/ui/lib/history-shapes.ts';
import { PagedListRegistry } from '@/ui/lib/paged-list-registry.ts';

export class HistoryFeed {
  private readonly registry: PagedListRegistry<HistoryQuery, HistoryEvent>;

  constructor(gateway: HistoryGateway, gate: () => Promise<void> = HistoryFeed.open) {
    this.registry = new PagedListRegistry(
      (query) => {
        return HistoryShapes.key(query);
      },
      async (query, cursor) => {
        await gate();
        return gateway.list(query, cursor);
      },
      HistoryFeed.idOf
    );
  }

  private static readonly open = () => {
    return Promise.resolve();
  };

  private static readonly idOf = (event: HistoryEvent) => {
    return String(event.id);
  };

  get(query: HistoryQuery) {
    return this.registry.get(query);
  }

  receive(events: HistoryEvent[]) {
    const newestFirst = [...events].sort((left, right) => {
      return right.id - left.id;
    });
    for (const { query, list } of this.registry.all()) {
      if (!list.watched) {
        list.invalidate();
        continue;
      }
      const matching = newestFirst.filter((event) => {
        return HistoryShapes.matches(query, event);
      });
      if (matching.length === 0) {
        continue;
      }
      list.patch(({ items, total }) => {
        const known = new Set(
          items.map((event) => {
            return event.id;
          })
        );
        const fresh = matching.filter((event) => {
          return !known.has(event.id);
        });
        return { items: [...fresh, ...items], total: total + fresh.length };
      });
    }
  }

  invalidateAll() {
    this.registry.invalidateAll();
  }
}
