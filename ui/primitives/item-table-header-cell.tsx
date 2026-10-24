import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TbChevronDown, TbChevronUp } from 'react-icons/tb';

const SORT_STATES = {
  none: 'none',
  asc: 'ascending',
  desc: 'descending',
} as const;

interface ItemTableHeaderCellProps {
  className: string;
  label: ReactNode;
  title?: string;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function ItemTableHeaderCell({
  className,
  label,
  title,
  sorted = null,
  onSort,
}: ItemTableHeaderCellProps) {
  if (!onSort) {
    return (
      <span role="columnheader" title={title} className={clsx('flex items-center', className)}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="columnheader"
      title={title}
      aria-sort={SORT_STATES[sorted ?? 'none']}
      onClick={onSort}
      className={clsx(
        'flex cursor-pointer items-center gap-0.5 rounded-2 text-left outline-none hover:text-fg-1 focus-visible:focus-ring',
        { 'text-fg-1': sorted !== null },
        className
      )}
    >
      {label}
      {sorted === 'asc' && <TbChevronUp className="size-3 shrink-0" />}
      {sorted === 'desc' && <TbChevronDown className="size-3 shrink-0" />}
    </button>
  );
}
