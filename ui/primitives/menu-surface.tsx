import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function MenuSurface({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'min-w-40 rounded-4 border border-line bg-canvas p-1 text-xs text-fg-1 shadow-lg',
        className
      )}
      {...props}
    />
  );
}
