import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

interface SearchResultRowProps extends ComponentProps<'button'> {
  itemId: string;
  title: string;
  status: ItemStatus;
  highlighted: boolean;
}

export function SearchResultRow({
  itemId,
  title,
  status,
  highlighted,
  className,
  ...props
}: SearchResultRowProps) {
  return (
    <button
      type="button"
      className={clsx(
        'flex h-7 w-full cursor-pointer items-center gap-1.5 rounded-3 px-1.5 text-left text-xs outline-none',
        highlighted ? 'bg-canvas-2' : '',
        className
      )}
      {...props}
    >
      <StatusIcon status={status} />
      <span className="w-20 shrink-0 font-mono text-mini text-fg-3">{itemId}</span>
      <span className="min-w-0 flex-1 truncate text-fg">{title}</span>
    </button>
  );
}
