import { clsx } from 'clsx';
import { TbBolt } from 'react-icons/tb';

import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { TallyView } from '@/ui/lib/tallies.ts';
import { ActivityCounts } from '@/ui/primitives/activity-counts.tsx';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';
import { ProgressMeter } from '@/ui/primitives/progress-meter.tsx';

interface BoardCardViewProps {
  item: ItemSummary;
  updatedLabel: string;
  progress: TallyView | null;
  dragging?: boolean;
}

export function BoardCardView({
  item,
  updatedLabel,
  progress,
  dragging = false,
}: BoardCardViewProps) {
  const epic = item.kind === 'epic';
  return (
    <div
      className={clsx(
        'flex flex-col gap-1 rounded-4 border bg-canvas px-2 py-1.5 shadow-xs transition-colors',
        epic ? 'border-accent-border' : 'border-line hover:border-line-emphasized',
        dragging ? 'opacity-40' : ''
      )}
    >
      <div className="flex items-center gap-1.5 text-mini text-fg-3">
        <PriorityIcon priority={item.priority} />
        {epic ? <TbBolt aria-label="Epic" className="size-3.5 shrink-0 text-accent-fg" /> : null}
        <span className="font-mono">{item.id}</span>
        <span className="ml-auto" title="Updated">
          {updatedLabel}
        </span>
      </div>
      <div className="line-clamp-2 text-xs leading-snug font-medium text-fg">{item.title}</div>
      {progress && <ProgressMeter percent={progress.percent} label={progress.label} />}
      {!progress && (
        <div className="flex min-h-3.5 items-center gap-2 text-mini text-fg-3">
          {item.epic ? <span className="min-w-0 truncate">{item.epic.title}</span> : null}
          <span className="ml-auto">
            <ActivityCounts
              subtasks={item.subtasks}
              blockedBy={item.blockedBy}
              commentCount={item.commentCount}
            />
          </span>
        </div>
      )}
    </div>
  );
}
