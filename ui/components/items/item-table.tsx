import { ItemTableHead } from '@/ui/components/items/item-table-head.tsx';
import { useItemTable } from '@/ui/hooks/use-item-table.ts';
import type { ItemSort, SortField } from '@/ui/lib/item-queries.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { PagedList } from '@/ui/lib/paged-list.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';
import { ItemTableRow } from '@/ui/primitives/item-table-row.tsx';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

interface ItemTableProps {
  list: PagedList<ItemSummary>;
  sort: ItemSort;
  showEpic: boolean;
  emptyLabel: string;
  onSort: (field: SortField) => void;
}

export function ItemTable({ list, sort, showEpic, emptyLabel, onSort }: ItemTableProps) {
  'use no memo';
  const {
    status,
    error,
    shown,
    total,
    loadingMore,
    nextBatch,
    loadMore,
    retry,
    attachScrollElement,
    totalSize,
    rows,
  } = useItemTable(list);
  let body;
  if (status === 'idle' || status === 'loading') {
    body = (
      <CenteredStatus>
        <Spinner />
        Loading
      </CenteredStatus>
    );
  } else if (status === 'failed') {
    body = (
      <CenteredStatus>
        Could not load items. {error?.message}
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      </CenteredStatus>
    );
  } else if (shown === 0) {
    body = <CenteredStatus>{emptyLabel}</CenteredStatus>;
  } else {
    body = (
      <div ref={attachScrollElement} className="min-h-0 flex-1 overflow-y-auto" role="rowgroup">
        <div className="relative w-full" style={{ height: totalSize }}>
          {rows.map((row) => {
            return (
              <div
                key={row.key}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${String(row.start)}px)` }}
              >
                {row.kind === 'item' && (
                  <ItemTableRow
                    to={row.href}
                    item={row.item}
                    updatedLabel={row.updatedLabel}
                    updatedTitle={row.updatedTitle}
                    showEpic={showEpic}
                  />
                )}
                {row.kind !== 'item' && (
                  <div className="flex h-7 items-center px-3">
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
  return (
    <div role="table" className="flex min-h-0 flex-1 flex-col">
      <ItemTableHead sort={sort} showEpic={showEpic} onSort={onSort} />
      {body}
    </div>
  );
}
