import { useEffect } from 'react';
import { useStore } from 'zustand';

import { PageBatches } from '@/ui/lib/page-batches.ts';
import type { PagedList } from '@/ui/lib/paged-list.ts';

export const usePagedList = <T>(list: PagedList<T>) => {
  useEffect(() => {
    void list.load();
    return list.watch();
  }, [list]);
  const state = useStore(list.store);
  const loadMore = () => {
    void list.loadMore();
  };
  const retry = () => {
    void list.reload();
  };
  return {
    ...state,
    loadMore,
    retry,
    remaining: PageBatches.remaining(state.items.length, state.total),
    nextBatch: PageBatches.next(state.items.length, state.total),
  };
};
