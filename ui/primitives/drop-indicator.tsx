import { clsx } from 'clsx';

interface DropIndicatorProps {
  edge: 'top' | 'bottom';
}

export function DropIndicator({ edge }: DropIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute right-0 left-0 z-10 h-0.5 rounded-pill bg-primary',
        edge === 'top' ? '-top-[4px]' : 'bottom-[2px]'
      )}
    />
  );
}
