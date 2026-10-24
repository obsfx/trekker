import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

interface LinkedItemRowProps {
  itemId: string;
  status: ItemStatus;
  priority?: Priority;
  done: boolean;
  title: ReactNode;
  action?: ReactNode;
}

export function LinkedItemRow({
  itemId,
  status,
  priority,
  done,
  title,
  action,
}: LinkedItemRowProps) {
  return (
    <div className="group flex h-7 items-center gap-1.5 rounded-3 px-1.5 text-xs hover:bg-canvas-1">
      <StatusIcon status={status} />
      <span className="w-20 shrink-0 font-mono text-mini text-fg-3">{itemId}</span>
      <span
        className={clsx('min-w-0 flex-1 truncate', done ? 'text-fg-3 line-through' : 'text-fg')}
      >
        {title}
      </span>
      {priority === undefined ? null : <PriorityIcon priority={priority} />}
      {action && (
        <span className="invisible flex shrink-0 group-focus-within:visible group-hover:visible">
          {action}
        </span>
      )}
    </div>
  );
}
