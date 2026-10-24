import { useBoardColumn } from '@/ui/hooks/use-board-column.ts';
import type { BoardView } from '@/ui/lib/board.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { BoardColumnFrame } from '@/ui/primitives/board-column-frame.tsx';
import { BoardColumnHeader } from '@/ui/primitives/board-column-header.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { ColumnPlaceholder } from '@/ui/primitives/column-placeholder.tsx';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';
import { BoardCard } from '@/ui/components/board/board-card.tsx';

interface BoardColumnProps {
  view: BoardView;
  status: ItemStatus;
  now: number;
}

export function BoardColumn({ view, status, now }: BoardColumnProps) {
  'use no memo';
  const {
    page,
    columnRef,
    scrollRef,
    rows,
    totalSize,
    measureElement,
    incoming,
    reorderable,
    add,
  } = useBoardColumn(view, status);
  return (
    <BoardColumnFrame ref={columnRef} highlighted={incoming} aria-label={status}>
      <BoardColumnHeader status={status} total={page.total} onAdd={add} />
      {(page.status === 'loading' || page.status === 'idle') && (
        <ColumnPlaceholder>
          <Spinner />
          Loading
        </ColumnPlaceholder>
      )}
      {page.status === 'failed' && (
        <ColumnPlaceholder>
          Could not load this column.
          <Button variant="text" onClick={page.retry}>
            Retry
          </Button>
        </ColumnPlaceholder>
      )}
      {page.status === 'ready' && page.items.length === 0 && (
        <ColumnPlaceholder>Drop cards here</ColumnPlaceholder>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative w-full" style={{ height: totalSize }}>
          {rows.map((row) => {
            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${String(row.start)}px)` }}
              >
                {row.item !== null && (
                  <BoardCard item={row.item} reorderable={reorderable} now={now} />
                )}
                {row.item === null && (
                  <LoadMoreButton
                    loading={page.loadingMore}
                    shown={page.items.length}
                    total={page.total}
                    next={page.nextBatch}
                    onClick={page.loadMore}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BoardColumnFrame>
  );
}
