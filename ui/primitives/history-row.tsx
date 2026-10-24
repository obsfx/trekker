import type { ReactNode } from 'react';

import type { HistoryGlyph as HistoryGlyphKind } from '@/ui/lib/history-labels.ts';
import { HistoryGlyph } from '@/ui/primitives/history-glyph.tsx';

interface HistoryRowProps {
  glyph: HistoryGlyphKind;
  verb: string;
  entity: ReactNode;
  title: string | null;
  snippet: string | null;
  time: string;
  timeTitle: string;
  children?: ReactNode;
}

export function HistoryRow({
  glyph,
  verb,
  entity,
  title,
  snippet,
  time,
  timeTitle,
  children,
}: HistoryRowProps) {
  return (
    <div className="flex h-7 min-w-0 items-center gap-2 px-3 text-xs hover:bg-canvas-1">
      <HistoryGlyph glyph={glyph} />
      <span className="shrink-0 text-fg-3">{verb}</span>
      <span className="shrink-0 font-mono text-mini text-fg-2">{entity}</span>
      {title ? <span className="max-w-80 min-w-0 shrink truncate text-fg">{title}</span> : null}
      <span className="flex min-w-0 shrink items-center gap-2 overflow-hidden">{children}</span>
      {snippet ? <span className="min-w-0 flex-1 truncate text-fg-3">{snippet}</span> : null}
      <time title={timeTitle} className="ml-auto shrink-0 pl-2 font-mono text-mini text-fg-4">
        {time}
      </time>
    </div>
  );
}
