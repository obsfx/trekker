import type { ReactNode } from 'react';

interface UnderlineTabsProps {
  label: string;
  children: ReactNode;
}

export function UnderlineTabs({ label, children }: UnderlineTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex h-8 shrink-0 items-stretch gap-3 border-b border-line-muted px-3 text-xs"
    >
      {children}
    </div>
  );
}
