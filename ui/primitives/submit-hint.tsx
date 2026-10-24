import { clsx } from 'clsx';

import { Kbd } from '@/ui/primitives/kbd.tsx';

interface SubmitHintProps {
  modifier: string;
  action?: string;
  className?: string;
}

export function SubmitHint({ modifier, action, className }: SubmitHintProps) {
  return (
    <span className={clsx('flex items-center gap-1 text-mini text-fg-4', className)}>
      <Kbd>{modifier}</Kbd>
      <Kbd>Enter</Kbd>
      {action}
    </span>
  );
}
