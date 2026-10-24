import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function EditableHeading({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={clsx(
        '-mx-1.5 w-[calc(100%+0.75rem)] cursor-text rounded-3 px-1.5 py-0.5 text-left text-base leading-tight font-semibold text-fg outline-none hover:bg-canvas-1 focus-visible:focus-ring',
        className
      )}
      {...props}
    />
  );
}
