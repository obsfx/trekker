import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

export type ButtonVariant =
  | 'solid'
  | 'secondary'
  | 'subtle'
  | 'outline'
  | 'text'
  | 'danger'
  | 'destructive';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: 'border-primary bg-primary text-primary-contrast hover:bg-primary/90',
  secondary: 'border-line-body bg-canvas text-fg-1 hover:bg-canvas-2',
  subtle: 'border-transparent bg-primary-subtle text-primary-emphasis hover:bg-primary-muted',
  outline: 'border-primary-border text-primary-fg hover:bg-primary-subtle',
  text: 'border-transparent text-fg-2 hover:bg-canvas-3 hover:text-fg-1',
  danger: 'border-transparent text-danger-fg hover:bg-danger-subtle',
  destructive: 'border-danger bg-danger text-danger-contrast hover:bg-danger/90',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-3 border px-2 text-xs font-medium whitespace-nowrap outline-none',
        'focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50',
        'data-[popup-open]:bg-canvas-3',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
