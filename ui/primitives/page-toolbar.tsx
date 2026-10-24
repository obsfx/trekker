import type { ReactNode } from 'react';

interface PageToolbarProps {
  children: ReactNode;
}

export function PageToolbar({ children }: PageToolbarProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-line-muted bg-canvas px-3">
      {children}
    </div>
  );
}
