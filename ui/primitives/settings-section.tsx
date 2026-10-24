import type { ReactNode } from 'react';

interface SettingsSectionProps {
  icon: ReactNode;
  title: string;
  hint: string;
  children: ReactNode;
}

export function SettingsSection({ icon, title, hint, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-1.5 border-b border-line-muted pb-4 last:border-b-0">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold text-fg-1">
        <span className="flex text-fg-3">{icon}</span>
        {title}
      </h2>
      <p className="text-mini text-fg-3">{hint}</p>
      {children}
    </section>
  );
}
