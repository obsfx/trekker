import type { ReactNode } from 'react';

interface SegmentedControlProps {
  label: string;
  children: ReactNode;
}

export function SegmentedControl({ label, children }: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-6 w-fit items-stretch rounded-3 border border-line-body p-0.5 text-xs"
    >
      {children}
    </div>
  );
}
