import { clsx } from 'clsx';

import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import type { StatusSegment } from '@/ui/lib/status-counts.ts';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

const SEGMENT_TONES: Record<ItemStatus, string> = {
  todo: 'bg-canvas-4',
  in_progress: 'bg-warning',
  completed: 'bg-success',
  wont_fix: 'bg-fg-4',
  archived: 'bg-fg-3',
};

interface ProgressSplitBarProps {
  counts: Record<ItemStatus, number>;
  segments: readonly StatusSegment[];
  summary: string;
}

export function ProgressSplitBar({ counts, segments, summary }: ProgressSplitBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={summary}
        className="flex h-1.5 overflow-hidden rounded-pill bg-canvas-3"
      >
        {segments.map((segment) => {
          return (
            <span
              key={segment.status}
              className={clsx('h-full', SEGMENT_TONES[segment.status])}
              style={{ width: `${String(segment.percent)}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-mini text-fg-3">
        <span className="font-medium text-fg-1">{summary}</span>
        {ItemStatuses.all.map((status) => {
          return (
            <span
              key={status}
              title={ItemStatuses.label(status)}
              className="flex items-center gap-1 tabular-nums"
            >
              <StatusIcon status={status} className="size-3" />
              {counts[status]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
