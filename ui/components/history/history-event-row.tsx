import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { useHistoryEvent } from '@/ui/hooks/use-history-event.ts';
import type { HistoryEvent } from '@/ui/lib/history-shapes.ts';
import { HistoryChange } from '@/ui/primitives/history-change.tsx';
import { HistoryRow } from '@/ui/primitives/history-row.tsx';

interface HistoryEventRowProps {
  event: HistoryEvent;
}

export function HistoryEventRow({ event }: HistoryEventRowProps) {
  const row = useHistoryEvent(event);
  let entity: ReactNode = row.label;
  if (row.href) {
    entity = (
      <Link to={row.href} className="hover:text-primary-fg hover:underline">
        {row.label}
      </Link>
    );
  }
  return (
    <HistoryRow
      glyph={row.glyph}
      verb={row.verb}
      entity={entity}
      title={row.title}
      snippet={row.snippet}
      time={row.time}
      timeTitle={row.fullTime}
    >
      {row.changes.map((change) => {
        return (
          <HistoryChange
            key={change.field}
            field={change.field}
            from={change.from}
            to={change.to}
          />
        );
      })}
    </HistoryRow>
  );
}
