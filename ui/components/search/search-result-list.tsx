import type { SearchResults } from '@/ui/hooks/use-search-results.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { SearchResultRow } from '@/ui/primitives/search-result-row.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

interface SearchResultListProps extends SearchResults {
  emptyLabel: string;
}

export function SearchResultList({
  searching,
  failed,
  empty,
  shown,
  total,
  loadingMore,
  nextBatch,
  loadMore,
  retry,
  attachScrollElement,
  totalSize,
  rows,
  highlight,
  setHighlight,
  choose,
  emptyLabel,
}: SearchResultListProps) {
  'use no memo';
  if (searching) {
    return (
      <MutedHint>
        <Spinner />
        Searching
      </MutedHint>
    );
  }
  if (failed) {
    return (
      <MutedHint>
        Search failed.
        <Button variant="text" onClick={retry}>
          Retry
        </Button>
      </MutedHint>
    );
  }
  if (empty) {
    return <MutedHint>{emptyLabel}</MutedHint>;
  }
  return (
    <div
      ref={attachScrollElement}
      role="group"
      aria-label="Search results"
      className="max-h-72 overflow-y-auto"
      onMouseDown={(event) => {
        event.preventDefault();
      }}
    >
      <div className="relative w-full" style={{ height: totalSize }}>
        {rows.map((row) => {
          return (
            <div
              key={row.key}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${String(row.start)}px)` }}
            >
              {row.kind === 'hit' && (
                <SearchResultRow
                  itemId={row.hit.id}
                  title={row.hit.title}
                  status={row.hit.status}
                  highlighted={row.index === highlight}
                  onMouseEnter={() => {
                    setHighlight(row.index);
                  }}
                  onClick={() => {
                    choose(row.hit);
                  }}
                />
              )}
              {row.kind !== 'hit' && (
                <div className="flex h-7 items-center">
                  <LoadMoreButton
                    loading={loadingMore}
                    shown={shown}
                    total={total}
                    next={nextBatch}
                    onClick={loadMore}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
