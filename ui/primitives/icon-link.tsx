import { clsx } from 'clsx';
import { Link, type LinkProps } from 'react-router';

import { ICON_BUTTON_CLASSES } from '@/ui/primitives/icon-button-classes.ts';

export function IconLink({ className, ...props }: LinkProps) {
  return <Link className={clsx(ICON_BUTTON_CLASSES, className)} {...props} />;
}
