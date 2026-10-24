import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

interface UnderlineTabProps extends ComponentProps<'button'> {
  active: boolean;
}

export function UnderlineTab({ active, className, ...props }: UnderlineTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={clsx(
        'flex cursor-pointer items-center gap-1 border-b-2 outline-none focus-visible:focus-ring',
        {
          'border-primary font-medium text-fg': active,
          'border-transparent text-fg-3 hover:text-fg-1': !active,
        },
        className
      )}
      {...props}
    />
  );
}
