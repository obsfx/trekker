import { clsx } from 'clsx';
import { TbBolt } from 'react-icons/tb';
import { Link, type LinkProps } from 'react-router';

import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import { ActivityCounts } from '@/ui/primitives/activity-counts.tsx';
import { ITEM_TABLE_COLUMNS } from '@/ui/primitives/item-table-columns.ts';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';
import { TagChip } from '@/ui/primitives/tag-chip.tsx';

interface ItemTableRowProps extends LinkProps {
  item: ItemSummary;
  updatedLabel: string;
  updatedTitle: string;
  showEpic: boolean;
}

export function ItemTableRow({
  item,
  updatedLabel,
  updatedTitle,
  showEpic,
  className,
  ...props
}: ItemTableRowProps) {
  return (
    <Link
      role="row"
      className={clsx(
        'flex h-7 items-center gap-2 border-b border-line-subtle px-3 text-xs text-fg no-underline outline-none',
        'hover:bg-canvas-1 focus-visible:bg-canvas-1',
        className
      )}
      {...props}
    >
      <span className={clsx('flex', ITEM_TABLE_COLUMNS.priority)}>
        <PriorityIcon priority={item.priority} />
      </span>
      <span className={clsx('flex', ITEM_TABLE_COLUMNS.status)}>
        <StatusIcon status={item.status} />
      </span>
      <span className={clsx('truncate font-mono text-mini text-fg-3', ITEM_TABLE_COLUMNS.id)}>
        {item.id}
      </span>
      <span className={clsx('flex items-center gap-1', ITEM_TABLE_COLUMNS.title)}>
        {item.kind === 'epic' && (
          <TbBolt aria-label="Epic" className="size-3.5 shrink-0 text-accent-fg" />
        )}
        <span className="truncate">{item.title}</span>
      </span>
      <span className={clsx('flex gap-1 overflow-hidden', ITEM_TABLE_COLUMNS.tags)}>
        {item.tags.map((tag) => {
          return <TagChip key={tag}>{tag}</TagChip>;
        })}
      </span>
      {showEpic && (
        <span className={clsx('truncate text-fg-3', ITEM_TABLE_COLUMNS.epic)}>
          {item.epic?.title ?? ''}
        </span>
      )}
      <span className={clsx('flex', ITEM_TABLE_COLUMNS.activity)}>
        <ActivityCounts
          subtasks={item.subtasks}
          blockedBy={item.blockedBy}
          commentCount={item.commentCount}
        />
      </span>
      <span
        title={updatedTitle}
        className={clsx('flex text-mini text-fg-4 tabular-nums', ITEM_TABLE_COLUMNS.updated)}
      >
        {updatedLabel}
      </span>
    </Link>
  );
}
