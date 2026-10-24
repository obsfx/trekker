import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function HeadingInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={clsx(
        '-mx-1.5 h-8 w-[calc(100%+0.75rem)] rounded-3 border border-primary-border bg-canvas px-1.5 text-base font-semibold text-fg focus-ring outline-none',
        className
      )}
      {...props}
    />
  );
}
