import type { ComponentProps, ReactNode } from 'react';

interface CheckFieldProps extends Omit<ComponentProps<'input'>, 'type'> {
  children: ReactNode;
}

export function CheckField({ children, ...props }: CheckFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-fg-2 select-none">
      <input type="checkbox" className="size-3.5 accent-primary" {...props} />
      {children}
    </label>
  );
}
