import { TbLink, TbMessage, TbSubtask } from 'react-icons/tb';

import type { Tally } from '@/ui/lib/item-shapes.ts';

interface ActivityCountsProps {
  subtasks: Tally;
  blockedBy: number;
  commentCount: number;
}

export function ActivityCounts({ subtasks, blockedBy, commentCount }: ActivityCountsProps) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-mini text-fg-3 tabular-nums">
      {subtasks.total > 0 && (
        <span className="flex items-center gap-0.5" title="Subtasks done">
          <TbSubtask className="size-3" />
          {subtasks.done}/{subtasks.total}
        </span>
      )}
      {blockedBy > 0 && (
        <span className="flex items-center gap-0.5 text-danger-fg" title="Blocked by open tasks">
          <TbLink className="size-3" />
          {blockedBy}
        </span>
      )}
      {commentCount > 0 && (
        <span className="flex items-center gap-0.5" title="Comments">
          <TbMessage className="size-3" />
          {commentCount}
        </span>
      )}
    </span>
  );
}
