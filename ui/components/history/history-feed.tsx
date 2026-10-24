import type { ReactNode } from 'react';

import { HistoryEventRow } from '@/ui/components/history/history-event-row.tsx';
import { HistoryToolbar } from '@/ui/components/history/history-toolbar.tsx';
import { useHistoryFeed } from '@/ui/hooks/use-history-feed.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';
import { DayHeader } from '@/ui/primitives/day-header.tsx';
import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';
import { Spinner } from '@/ui/primitives/spinner.tsx';

const FOOTER_HEIGHT = 40;

export function HistoryFeed() {
  'use no memo';
  const {
    status,
    empty,
    totalLabel,
    shown,
    total,
    loadingMore,
    nextBatch,
    loadMore,
    retry,
    attachScrollElement,
    totalSize,
    measureElement,
    rows,
  } = useHistoryFeed();

  let body: ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = (
      <CenteredStatus>
        <Spinner />
        Loading history
      </CenteredStatus>
    );
  } else if (status === 'failed') {
    body = (
      <CenteredStatus>
        History could not be loaded.
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      </CenteredStatus>
    );
  } else if (empty) {
    body = <CenteredStatus>No events match these filters.</CenteredStatus>;
  } else {
    body = (
      <div ref={attachScrollElement} className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative w-full" style={{ height: totalSize }}>
          {rows.map((feedRow) => {
            let content = (
              <div className="flex items-center px-3 py-2" style={{ height: FOOTER_HEIGHT }}>
                <LoadMoreButton
                  loading={loadingMore}
                  shown={shown}
                  total={total}
                  next={nextBatch}
                  onClick={loadMore}
                />
              </div>
            );
            if (feedRow.row?.kind === 'day') {
              content = <DayHeader label={feedRow.row.label} />;
            }
            if (feedRow.row?.kind === 'event') {
              content = <HistoryEventRow event={feedRow.row.event} />;
            }
            return (
              <div
                key={feedRow.key}
                data-index={feedRow.index}
                ref={measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${String(feedRow.start)}px)` }}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HistoryToolbar totalLabel={totalLabel} />
      {body}
    </div>
  );
}
