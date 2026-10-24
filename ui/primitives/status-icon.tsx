import { clsx } from 'clsx';
import { TbArchive, TbCircle, TbCircleCheckFilled, TbCircleDot, TbCircleOff } from 'react-icons/tb';

import type { IconGlyph } from '@/ui/primitives/icon-glyph.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';

const STATUS_GLYPHS: Record<ItemStatus, IconGlyph> = {
  todo: { Icon: TbCircle, tone: 'text-fg-3' },
  in_progress: { Icon: TbCircleDot, tone: 'text-warning-fg' },
  completed: { Icon: TbCircleCheckFilled, tone: 'text-success-fg' },
  wont_fix: { Icon: TbCircleOff, tone: 'text-fg-4' },
  archived: { Icon: TbArchive, tone: 'text-fg-4' },
};

interface StatusIconProps {
  status: ItemStatus;
  className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
  const { Icon, tone } = STATUS_GLYPHS[status];
  const label = ItemStatuses.label(status);
  return (
    <Icon role="img" aria-label={label} className={clsx('size-3.5 shrink-0', tone, className)}>
      <title>{label}</title>
    </Icon>
  );
}
