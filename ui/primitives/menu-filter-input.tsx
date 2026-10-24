import type { ComponentProps } from 'react';
import { TbSearch } from 'react-icons/tb';

export function MenuFilterInput(props: ComponentProps<'input'>) {
  return (
    <label className="mb-1 flex h-6 items-center gap-1 border-b border-line-muted px-1.5 text-fg-3">
      <TbSearch className="size-3 shrink-0" />
      <input
        className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-4"
        {...props}
      />
    </label>
  );
}
