import type { ItemGateway } from '@/ui/lib/gateways.ts';
import { ItemQueries, type ItemQuery } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { PagedList } from '@/ui/lib/paged-list.ts';
import { PagedListRegistry } from '@/ui/lib/paged-list-registry.ts';

export class ItemLists {
  private static readonly lookupBatch = 200;

  private readonly gateway: ItemGateway;
  private readonly registry: PagedListRegistry<ItemQuery, ItemSummary>;

  constructor(gateway: ItemGateway, gate: () => Promise<void> = ItemLists.open) {
    this.gateway = gateway;
    this.registry = new PagedListRegistry(
      (query) => {
        return ItemQueries.key(query);
      },
      async (query, cursor) => {
        await gate();
        return gateway.list(query, cursor);
      },
      ItemLists.idOf
    );
  }

  private static readonly idOf = (item: ItemSummary) => {
    return item.id;
  };

  private static readonly open = () => {
    return Promise.resolve();
  };

  private static placeSorted(items: ItemSummary[], item: ItemSummary, query: ItemQuery) {
    const compare = ItemQueries.compare(query.sort);
    const index = items.findIndex((other) => {
      return compare(item, other) < 0;
    });
    if (index === -1) {
      return [...items, item];
    }
    return [...items.slice(0, index), item, ...items.slice(index)];
  }

  private static withinFetchedRange(
    list: PagedList<ItemSummary>,
    item: ItemSummary,
    query: ItemQuery
  ) {
    if (list.state.nextCursor === null) {
      return true;
    }
    const boundary = list.boundary;
    if (!boundary) {
      return false;
    }
    return ItemQueries.compare(query.sort)(item, boundary) <= 0;
  }

  get(query: ItemQuery) {
    return this.registry.get(query);
  }

  apply(changed: ItemSummary[], removedIds: Iterable<string>) {
    const removed = new Set(removedIds);
    const changedIds = new Set(changed.map(ItemLists.idOf));
    if (changed.length === 0 && removed.size === 0) {
      return;
    }
    for (const { query, list } of this.registry.all()) {
      if (!list.watched) {
        list.invalidate();
        continue;
      }
      list.patch(({ items, total }) => {
        const loaded = new Set(items.map(ItemLists.idOf));
        let delta = 0;
        let next = items.filter((item) => {
          return !removed.has(item.id) && !changedIds.has(item.id);
        });
        for (const id of removed) {
          if (loaded.has(id) && !changedIds.has(id)) {
            delta -= 1;
          }
        }
        for (const item of changed) {
          const matches = ItemQueries.matches(query, item);
          const wasLoaded = loaded.has(item.id);
          if (wasLoaded && !matches) {
            delta -= 1;
          }
          if (!wasLoaded && matches) {
            delta += 1;
          }
          if (matches && ItemLists.withinFetchedRange(list, item, query)) {
            next = ItemLists.placeSorted(next, item, query);
          }
        }
        return { items: next, total: total + delta };
      });
    }
  }

  async refreshIds(ids: string[]) {
    const changed: ItemSummary[] = [];
    for (let start = 0; start < ids.length; start += ItemLists.lookupBatch) {
      const batch = ids.slice(start, start + ItemLists.lookupBatch);
      const found = await this.gateway.byIds(batch);
      changed.push(...found);
    }
    const foundIds = new Set(changed.map(ItemLists.idOf));
    const missing = ids.filter((id) => {
      return !foundIds.has(id);
    });
    this.apply(changed, missing);
  }

  async refreshTotals() {
    const watched = this.registry.all().filter(({ list }) => {
      return list.watched && list.state.status === 'ready';
    });
    await Promise.all(
      watched.map(async ({ query, list }) => {
        const total = await this.gateway.count(query).catch(() => {
          return null;
        });
        if (total !== null) {
          list.setTotal(total);
        }
      })
    );
  }

  invalidateAll() {
    this.registry.invalidateAll();
  }
}
