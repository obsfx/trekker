import type { ReactNode } from 'react';

interface TagChipProps {
  children: ReactNode;
}

export function TagChip({ children }: TagChipProps) {
  return (
    <span className="inline-flex h-4 shrink-0 items-center rounded-2 bg-canvas-2 px-1 text-micro text-fg-2">
      {children}
    </span>
  );
}
