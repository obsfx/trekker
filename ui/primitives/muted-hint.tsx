import type { ReactNode } from 'react';

interface MutedHintProps {
  children: ReactNode;
}

export function MutedHint({ children }: MutedHintProps) {
  return <div className="flex h-7 items-center gap-1.5 px-1.5 text-xs text-fg-3">{children}</div>;
}
