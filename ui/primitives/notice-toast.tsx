import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TbAlertTriangle, TbInfoCircle, TbX } from 'react-icons/tb';

import type { IconGlyph } from '@/ui/primitives/icon-glyph.ts';

type NoticeTone = 'error' | 'info';

interface NoticeToneStyle extends IconGlyph {
  role: 'alert' | 'status';
  border: string;
}

const NOTICE_TONES: Record<NoticeTone, NoticeToneStyle> = {
  error: {
    Icon: TbAlertTriangle,
    tone: 'text-danger-fg',
    role: 'alert',
    border: 'border-danger-border',
  },
  info: { Icon: TbInfoCircle, tone: 'text-info-fg', role: 'status', border: 'border-line' },
};

interface NoticeToastProps {
  tone: NoticeTone;
  onDismiss: () => void;
  children: ReactNode;
}

export function NoticeToast({ tone, onDismiss, children }: NoticeToastProps) {
  const style = NOTICE_TONES[tone];
  return (
    <div
      role={style.role}
      className={clsx(
        'flex w-80 items-start gap-2 rounded-4 border bg-canvas px-2.5 py-2 text-xs shadow-lg',
        style.border
      )}
    >
      <style.Icon className={clsx('mt-px size-3.5 shrink-0', style.tone)} />
      <span className="min-w-0 flex-1 text-fg-1">{children}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="flex size-4 cursor-pointer items-center justify-center rounded-2 text-fg-3 hover:bg-canvas-3"
      >
        <TbX className="size-3" />
      </button>
    </div>
  );
}
