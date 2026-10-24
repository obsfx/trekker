import type { ReactNode } from 'react';

interface CrumbBarProps {
  children: ReactNode;
}

export function CrumbBar({ children }: CrumbBarProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex h-8 shrink-0 items-center gap-1 border-b border-line-muted bg-canvas px-3 text-xs text-fg-3"
    >
      {children}
    </nav>
  );
}
