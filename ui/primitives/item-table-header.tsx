import type { ReactNode } from 'react';

interface ItemTableHeaderProps {
  children: ReactNode;
}

export function ItemTableHeader({ children }: ItemTableHeaderProps) {
  return (
    <div
      role="row"
      className="flex h-7 shrink-0 items-center gap-2 border-b border-line bg-canvas-1 px-3 text-mini font-medium text-fg-3"
    >
      {children}
    </div>
  );
}
