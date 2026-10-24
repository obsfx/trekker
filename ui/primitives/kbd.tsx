import type { ReactNode } from 'react';

interface KbdProps {
  children: ReactNode;
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="flex h-4 min-w-4 items-center justify-center rounded-2 border border-line px-1 font-mono text-micro text-fg-3">
      {children}
    </kbd>
  );
}
