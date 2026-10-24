import { useEffect } from 'react';

import { useNow } from '@/ui/hooks/use-now.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';
import { useRowVirtualizer } from '@/ui/hooks/use-row-virtualizer.ts';
import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { PagedList } from '@/ui/lib/paged-list.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';

const ROW_HEIGHT = 28;

interface ItemTableRowModel {
  kind: 'item';
  key: string;
  start: number;
  item: ItemSummary;
  href: string;
  updatedLabel: string;
  updatedTitle: string;
}

interface LoadMoreRowModel {
  kind: 'load-more';
  key: string;
  start: number;
}

export const useItemTable = (list: PagedList<ItemSummary>) => {
  'use no memo';
  const page = usePagedList(list);
  const hasMore = page.nextCursor !== null;
  const { virtualizer, attachScrollElement } = useRowVirtualizer({
    count: page.items.length + (hasMore ? 1 : 0),
    rowHeight: ROW_HEIGHT,
  });
  useEffect(() => {
    virtualizer.scrollToOffset(0);
  }, [list, virtualizer]);
  const now = useNow();
  const rows = virtualizer
    .getVirtualItems()
    .map((virtualRow): ItemTableRowModel | LoadMoreRowModel => {
      const item = page.items[virtualRow.index];
      if (!item) {
        return { kind: 'load-more', key: 'load-more', start: virtualRow.start };
      }
      return {
        kind: 'item',
        key: item.id,
        start: virtualRow.start,
        item,
        href: AppRoutes.item(item),
        updatedLabel: RelativeTime.short(item.updatedAt, now),
        updatedTitle: `Updated ${RelativeTime.full(item.updatedAt)}`,
      };
    });
  return {
    status: page.status,
    error: page.error,
    shown: page.items.length,
    total: page.total,
    loadingMore: page.loadingMore,
    nextBatch: page.nextBatch,
    loadMore: page.loadMore,
    retry: page.retry,
    attachScrollElement,
    totalSize: virtualizer.getTotalSize(),
    rows,
  };
};
