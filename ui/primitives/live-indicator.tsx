import { clsx } from 'clsx';
import { TbPointFilled } from 'react-icons/tb';

import type { LiveState } from '@/ui/lib/server-events.ts';

interface LiveStateStyle {
  label: string;
  tone: string;
  title: string;
}

const LIVE_STATES: Record<LiveState, LiveStateStyle> = {
  live: { label: 'Live', tone: 'text-success', title: 'Live updates connected' },
  connecting: { label: 'Connecting', tone: 'text-warning animate-pulse', title: 'Connecting' },
  offline: { label: 'Offline', tone: 'text-danger', title: 'Live updates disconnected' },
};

interface LiveIndicatorProps {
  state: LiveState;
}

export function LiveIndicator({ state }: LiveIndicatorProps) {
  const { label, tone, title } = LIVE_STATES[state];
  return (
    <span role="status" title={title} className="flex items-center gap-0.5 text-mini text-fg-3">
      <TbPointFilled className={clsx('size-3', tone)} />
      <span className="max-md:sr-only">{label}</span>
    </span>
  );
}
