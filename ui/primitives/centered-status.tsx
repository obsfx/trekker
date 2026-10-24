import type { ReactNode } from 'react';

interface CenteredStatusProps {
  children: ReactNode;
}

export function CenteredStatus({ children }: CenteredStatusProps) {
  return (
    <div className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 text-xs text-fg-3">
      {children}
    </div>
  );
}
