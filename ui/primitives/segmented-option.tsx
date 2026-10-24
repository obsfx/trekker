import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

interface SegmentedOptionProps extends ComponentProps<'button'> {
  active: boolean;
}

export function SegmentedOption({ active, className, ...props }: SegmentedOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={clsx(
        'flex cursor-pointer items-center gap-1 rounded-2 px-1.5 outline-none focus-visible:focus-ring',
        active ? 'bg-canvas-3 font-medium text-fg' : 'text-fg-3 hover:text-fg-1',
        className
      )}
      {...props}
    />
  );
}
