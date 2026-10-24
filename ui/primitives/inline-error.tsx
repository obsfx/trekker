import type { ReactNode } from 'react';

interface InlineErrorProps {
  children: ReactNode;
}

export function InlineError({ children }: InlineErrorProps) {
  return <span className="text-mini text-danger-fg">{children}</span>;
}
