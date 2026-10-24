import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

interface TextAreaFieldProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
  mono?: boolean;
}

export function TextAreaField({
  invalid = false,
  mono = false,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <textarea
      className={clsx(
        'w-full resize-y rounded-3 border bg-canvas p-1.5 text-xs leading-relaxed text-fg outline-none placeholder:text-fg-4 focus:focus-ring',
        invalid ? 'border-danger-border' : 'border-line-body focus:border-primary-border',
        mono ? 'font-mono' : '',
        className
      )}
      {...props}
    />
  );
}
