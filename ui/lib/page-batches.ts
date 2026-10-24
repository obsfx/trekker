import { ItemQueries } from '@/ui/lib/item-queries.ts';

export abstract class PageBatches {
  static remaining(shown: number, total: number) {
    return Math.max(total - shown, 0);
  }

  static next(shown: number, total: number) {
    return Math.min(ItemQueries.pageSize, PageBatches.remaining(shown, total));
  }
}
