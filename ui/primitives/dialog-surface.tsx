import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export function DialogSurface({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'fixed top-[14vh] left-1/2 z-50 flex max-h-[76vh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 flex-col rounded-6 border border-line bg-canvas text-xs shadow-xl outline-none',
        'transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0',
        className
      )}
      {...props}
    />
  );
}
