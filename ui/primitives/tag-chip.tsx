import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface TagChipProps {
  truncate?: boolean;
  children: ReactNode;
}

export function TagChip({ truncate = false, children }: TagChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex h-4 items-center rounded-2 bg-canvas-2 px-1 text-micro text-fg-2',
        truncate ? 'min-w-0' : 'shrink-0'
      )}
    >
      {truncate ? (
        <span data-truncatable className="truncate">
          {children}
        </span>
      ) : (
        children
      )}
    </span>
  );
}
