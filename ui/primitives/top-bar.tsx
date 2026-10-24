import type { ReactNode } from 'react';

interface TopBarProps {
  children: ReactNode;
}

export function TopBar({ children }: TopBarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-canvas px-3 sm:gap-3">
      {children}
    </header>
  );
}
