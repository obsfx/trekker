import { clsx } from 'clsx';
import {
  TbAntennaBars1,
  TbAntennaBars2,
  TbAntennaBars3,
  TbAntennaBars4,
  TbAntennaBars5,
  TbFlameFilled,
} from 'react-icons/tb';

import type { IconGlyph } from '@/ui/primitives/icon-glyph.ts';
import { Priorities, type Priority } from '@/ui/lib/priorities.ts';

const PRIORITY_GLYPHS: Record<Priority, IconGlyph> = {
  0: { Icon: TbFlameFilled, tone: 'text-danger-fg' },
  1: { Icon: TbAntennaBars5, tone: 'text-fg-1' },
  2: { Icon: TbAntennaBars4, tone: 'text-fg-2' },
  3: { Icon: TbAntennaBars3, tone: 'text-fg-3' },
  4: { Icon: TbAntennaBars2, tone: 'text-fg-3' },
  5: { Icon: TbAntennaBars1, tone: 'text-fg-4' },
};

interface PriorityIconProps {
  priority: Priority;
  className?: string;
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  const { Icon, tone } = PRIORITY_GLYPHS[priority];
  const label = Priorities.describe(priority);
  return (
    <Icon role="img" aria-label={label} className={clsx('size-3.5 shrink-0', tone, className)}>
      <title>{label}</title>
    </Icon>
  );
}
