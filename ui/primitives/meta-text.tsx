import type { ReactNode } from 'react';

interface MetaTextProps {
  title?: string;
  children: ReactNode;
}

export function MetaText({ title, children }: MetaTextProps) {
  return (
    <span title={title} className="text-mini whitespace-nowrap text-fg-4">
      {children}
    </span>
  );
}
