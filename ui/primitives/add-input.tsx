import type { ComponentProps } from 'react';
import { TbPlus } from 'react-icons/tb';

export function AddInput(props: ComponentProps<'input'>) {
  return (
    <label className="flex h-7 items-center gap-1.5 rounded-3 px-1.5 text-xs text-fg-3 focus-within:bg-canvas-1 hover:bg-canvas-1">
      <TbPlus aria-hidden="true" className="size-3.5 shrink-0" />
      <input
        className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-4"
        {...props}
      />
    </label>
  );
}
