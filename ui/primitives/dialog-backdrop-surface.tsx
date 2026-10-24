import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function DialogBackdropSurface({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'fixed inset-0 z-40 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}
