import { type KeyboardEvent, useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';
import { useRowVirtualizer } from '@/ui/hooks/use-row-virtualizer.ts';
import type { SearchHit } from '@/ui/lib/gateways.ts';
import { ListHighlight } from '@/ui/lib/list-highlight.ts';
import { type SearchQuery, SearchQueries } from '@/ui/lib/search-queries.ts';

const ROW_HEIGHT = 28;

interface HighlightState {
  key: string;
  index: number;
}

interface SearchHitRowModel {
  kind: 'hit';
  key: string;
  start: number;
  index: number;
  hit: SearchHit;
}

interface SearchLoadMoreRowModel {
  kind: 'load-more';
  key: string;
  start: number;
}

export type SearchResults = ReturnType<typeof useSearchResults>;

export const useSearchResults = (
  query: SearchQuery,
  excludeIds: readonly string[],
  onChoose: (hit: SearchHit) => void
) => {
  'use no memo';
  const { searches } = useServices();
  const page = usePagedList(searches.get(query));
  const key = SearchQueries.key(query);
  const [highlightState, setHighlightState] = useState<HighlightState>({ key, index: 0 });
  const hits = page.items.filter((hit) => {
    return !excludeIds.includes(hit.id);
  });
  const hasMore = page.nextCursor !== null;
  const { virtualizer, attachScrollElement } = useRowVirtualizer({
    count: hits.length + (hasMore ? 1 : 0),
    rowHeight: ROW_HEIGHT,
  });
  let highlight = 0;
  if (highlightState.key === key) {
    highlight = Math.min(highlightState.index, Math.max(hits.length - 1, 0));
  }
  const setHighlight = (index: number) => {
    setHighlightState({ key, index });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moved = ListHighlight.step(event.key, highlight, hits.length);
    if (moved !== null) {
      event.preventDefault();
      setHighlight(moved);
      virtualizer.scrollToIndex(moved);
      return;
    }
    const hit = hits[highlight];
    if (event.key === 'Enter' && hit) {
      event.preventDefault();
      onChoose(hit);
    }
  };

  const rows = virtualizer
    .getVirtualItems()
    .map((virtualRow): SearchHitRowModel | SearchLoadMoreRowModel => {
      const hit = hits[virtualRow.index];
      if (!hit) {
        return { kind: 'load-more', key: 'load-more', start: virtualRow.start };
      }
      return { kind: 'hit', key: hit.id, start: virtualRow.start, index: virtualRow.index, hit };
    });

  return {
    searching: page.status === 'idle' || page.status === 'loading',
    failed: page.status === 'failed',
    empty: page.status === 'ready' && hits.length === 0,
    shown: page.items.length,
    total: page.total,
    loadingMore: page.loadingMore,
    nextBatch: page.nextBatch,
    loadMore: page.loadMore,
    retry: page.retry,
    attachScrollElement,
    totalSize: virtualizer.getTotalSize(),
    rows,
    highlight,
    setHighlight,
    onKeyDown,
    choose: onChoose,
  };
};
