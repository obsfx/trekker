import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface PopoverPanelProps {
  className?: string;
  children: ReactNode;
}

export function PopoverPanel({ className, children }: PopoverPanelProps) {
  return (
    <div
      className={clsx(
        'absolute top-full z-50 mt-1 rounded-4 border border-line bg-canvas p-1 shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}
