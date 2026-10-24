import { clsx } from 'clsx';
import { TbLoader2 } from 'react-icons/tb';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <TbLoader2 aria-hidden="true" className={clsx('size-3.5 animate-spin text-fg-3', className)} />
  );
}
