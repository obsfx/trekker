import { clsx } from 'clsx';
import { TbLink, TbMessage, TbPencil, TbPlus, TbTrash } from 'react-icons/tb';

import type { IconGlyph } from '@/ui/primitives/icon-glyph.ts';
import type { HistoryGlyph as HistoryGlyphKind } from '@/ui/lib/history-labels.ts';

const GLYPHS: Record<HistoryGlyphKind, IconGlyph> = {
  create: { Icon: TbPlus, tone: 'text-success-fg' },
  update: { Icon: TbPencil, tone: 'text-primary-fg' },
  delete: { Icon: TbTrash, tone: 'text-danger-fg' },
  comment: { Icon: TbMessage, tone: 'text-info-fg' },
  dependency: { Icon: TbLink, tone: 'text-accent-fg' },
};

interface HistoryGlyphProps {
  glyph: HistoryGlyphKind;
}

export function HistoryGlyph({ glyph }: HistoryGlyphProps) {
  const { Icon, tone } = GLYPHS[glyph];
  return <Icon aria-hidden="true" className={clsx('size-3.5 shrink-0', tone)} />;
}
