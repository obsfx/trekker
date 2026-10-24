import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function BareInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={clsx(
        'w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-4',
        className
      )}
      {...props}
    />
  );
}
