import type { ReactNode } from 'react';

interface LabeledFieldProps {
  label: string;
  error?: string | null;
  children: ReactNode;
}

export function LabeledField({ label, error = null, children }: LabeledFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-32 shrink-0 text-fg-2">{label}</span>
        {children}
      </div>
      {error ? <span className="pl-34 text-mini text-danger-fg">{error}</span> : null}
    </div>
  );
}
