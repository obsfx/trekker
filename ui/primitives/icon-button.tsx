import { clsx } from 'clsx';
import type { ComponentProps } from 'react';

import { ICON_BUTTON_CLASSES } from '@/ui/primitives/icon-button-classes.ts';

export function IconButton({ className, ...props }: ComponentProps<'button'>) {
  return <button type="button" className={clsx(ICON_BUTTON_CLASSES, className)} {...props} />;
}
