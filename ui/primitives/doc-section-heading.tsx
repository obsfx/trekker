import type { ReactNode } from 'react';

interface DocSectionHeadingProps {
  icon: ReactNode;
  label: string;
  count?: string;
  action?: ReactNode;
}

export function DocSectionHeading({ icon, label, count, action }: DocSectionHeadingProps) {
  return (
    <div className="flex h-6 items-center gap-1.5 text-xs font-semibold text-fg-1">
      <span className="flex shrink-0 text-fg-3">{icon}</span>
      {label}
      {count ? <span className="font-normal text-fg-3 tabular-nums">{count}</span> : null}
      {action ? <span className="ml-auto flex items-center">{action}</span> : null}
    </div>
  );
}
