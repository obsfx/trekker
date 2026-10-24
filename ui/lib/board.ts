import plur from 'plur';

import { ApiError } from '@/ui/lib/api-client.ts';
import type { ItemGateway } from '@/ui/lib/gateways.ts';
import type { ItemLists } from '@/ui/lib/item-lists.ts';
import { ItemQueries, type ItemQuery, type ItemSort } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';

export type BoardKind = 'all' | 'epic' | 'task';

export interface BoardView {
  kind: BoardKind;
  epicId: string | null;
  sort: ItemSort;
}

export interface BoardDrop {
  item: ItemSummary;
  to: ItemStatus;
  anchorId: string | null;
  placement: 'before' | 'after';
}

export class Board {
  private readonly lists: ItemLists;
  private readonly gateway: ItemGateway;
  private readonly notices: NoticePort;

  constructor(lists: ItemLists, gateway: ItemGateway, notices: NoticePort) {
    this.lists = lists;
    this.gateway = gateway;
    this.notices = notices;
  }

  static query(view: BoardView, status: ItemStatus): ItemQuery {
    const types: ItemQuery['types'] = view.kind === 'all' ? ['epic', 'task'] : [view.kind];
    return {
      ...ItemQueries.empty(view.sort),
      types,
      statuses: [status],
      epicId: view.epicId,
    };
  }

  static isManual(view: BoardView) {
    return view.sort.field === 'rank';
  }

  static canDrop(item: ItemSummary, to: ItemStatus) {
    return !(item.kind === 'epic' && to === 'wont_fix');
  }

  async archiveCompleted() {
    try {
      const result = await this.gateway.archiveCompleted();
      this.lists.invalidateAll();
      this.notices.info(
        `Archived ${String(result.tasks)} ${plur('task', result.tasks)} and ${String(result.epics)} ${plur('epic', result.epics)}`
      );
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Archiving completed items'));
    }
  }

  column(view: BoardView, status: ItemStatus) {
    return this.lists.get(Board.query(view, status));
  }

  async move(view: BoardView, drop: BoardDrop) {
    const { item, to, anchorId, placement } = drop;
    if (item.status === to && (anchorId === null || anchorId === item.id)) {
      return;
    }
    const source = this.column(view, item.status);
    const target = this.column(view, to);
    const moved: ItemSummary = { ...item, status: to };
    const sameColumn = item.status === to;
    if (!sameColumn) {
      source.patch(({ items, total }) => {
        return {
          items: items.filter((entry) => {
            return entry.id !== item.id;
          }),
          total: total - 1,
        };
      });
    }
    target.patch(({ items, total }) => {
      const without = items.filter((entry) => {
        return entry.id !== item.id;
      });
      const anchorIndex = without.findIndex((entry) => {
        return entry.id === anchorId;
      });
      let index = 0;
      if (anchorIndex !== -1) {
        index = placement === 'before' ? anchorIndex : anchorIndex + 1;
      }
      return {
        items: [...without.slice(0, index), moved, ...without.slice(index)],
        total: sameColumn ? total : total + 1,
      };
    });
    try {
      const summary = await this.gateway.move(item.id, { status: to, anchorId, placement });
      this.lists.apply([summary], []);
    } catch (error) {
      this.notices.error(ApiError.describe(error, `Moving ${item.id}`));
      await Promise.all([source.reload(), target.reload()]);
    }
  }
}
