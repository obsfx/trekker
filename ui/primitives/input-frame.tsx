import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface InputFrameProps {
  invalid?: boolean;
  className?: string;
  children: ReactNode;
}

export function InputFrame({ invalid = false, className, children }: InputFrameProps) {
  return (
    <label
      className={clsx(
        'flex h-6 min-w-0 items-center gap-1 rounded-3 border bg-canvas px-1.5 text-xs text-fg-3',
        {
          'border-danger-border focus-within:focus-ring': invalid,
          'border-line-body focus-within:border-primary-border focus-within:focus-ring': !invalid,
        },
        className
      )}
    >
      {children}
    </label>
  );
}
