import type { ReactNode } from 'react';

interface ColumnPlaceholderProps {
  children: ReactNode;
}

export function ColumnPlaceholder({ children }: ColumnPlaceholderProps) {
  return (
    <div className="flex h-16 items-center justify-center gap-1.5 rounded-4 border border-dashed border-line text-mini text-fg-3">
      {children}
    </div>
  );
}
