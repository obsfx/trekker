import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

interface BoardColumnFrameProps extends ComponentProps<'section'> {
  highlighted: boolean;
}

export function BoardColumnFrame({ highlighted, className, ...props }: BoardColumnFrameProps) {
  return (
    <section
      className={clsx(
        'flex min-h-0 min-w-64 flex-1 basis-0 flex-col gap-1.5 rounded-5 p-1.5 transition-colors',
        {
          'bg-primary-subtle outline-2 -outline-offset-2 outline-primary-border outline-dashed':
            highlighted,
          'bg-canvas-1': !highlighted,
        },
        className
      )}
      {...props}
    />
  );
}
