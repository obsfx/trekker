import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

interface SwitchToggleProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchToggle({
  checked,
  onChange,
  children,
  className,
  ...props
}: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        onChange(!checked);
      }}
      className={clsx(
        'flex cursor-pointer items-center gap-2 self-start rounded-3 text-xs text-fg-1 outline-none focus-visible:focus-ring disabled:cursor-default disabled:opacity-50',
        className
      )}
      {...props}
    >
      <span
        className={clsx(
          'flex h-4 w-7 shrink-0 items-center rounded-pill p-0.5 transition-colors',
          checked ? 'bg-primary' : 'bg-canvas-4'
        )}
      >
        <span
          className={clsx(
            'size-3 rounded-pill bg-white shadow-xs transition-transform',
            checked ? 'translate-x-3' : ''
          )}
        />
      </span>
      {children}
    </button>
  );
}
