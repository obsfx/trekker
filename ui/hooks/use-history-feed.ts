import { useHistoryPage } from '@/ui/hooks/use-history-page.ts';
import { useRowVirtualizer } from '@/ui/hooks/use-row-virtualizer.ts';
import type { HistoryRow } from '@/ui/lib/history-rows.ts';

const ROW_HEIGHT = 28;
const FOOTER_KEY = 'footer';

interface HistoryFeedRow {
  key: string;
  index: number;
  start: number;
  row: HistoryRow | null;
}

export const useHistoryFeed = () => {
  'use no memo';
  const page = useHistoryPage();
  let count = page.rows.length;
  if (page.nextCursor !== null) {
    count += 1;
  }
  const { virtualizer, attachScrollElement } = useRowVirtualizer({ count, rowHeight: ROW_HEIGHT });
  const rows = virtualizer.getVirtualItems().map((virtualRow): HistoryFeedRow => {
    const row = page.rows[virtualRow.index] ?? null;
    return {
      key: row?.key ?? FOOTER_KEY,
      index: virtualRow.index,
      start: virtualRow.start,
      row,
    };
  });
  return {
    status: page.status,
    empty: page.rows.length === 0,
    totalLabel: page.totalLabel,
    shown: page.items.length,
    total: page.total,
    loadingMore: page.loadingMore,
    nextBatch: page.nextBatch,
    loadMore: page.loadMore,
    retry: page.retry,
    attachScrollElement,
    totalSize: virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
    rows,
  };
};
