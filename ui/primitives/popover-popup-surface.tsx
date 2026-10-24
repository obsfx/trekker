import { Popover } from '@base-ui/react/popover';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { MenuSurface } from '@/ui/primitives/menu-surface.tsx';

interface PopoverPopupSurfaceProps {
  align: 'start' | 'end';
  anchor?: Element | null;
  className?: string;
  children: ReactNode;
}

export function PopoverPopupSurface({
  align,
  anchor,
  className,
  children,
}: PopoverPopupSurfaceProps) {
  return (
    <Popover.Portal>
      <Popover.Positioner
        side="bottom"
        align={align}
        anchor={anchor}
        sideOffset={4}
        className="z-50"
      >
        <Popover.Popup
          render={
            <MenuSurface
              className={clsx(
                'outline-none',
                'origin-(--transform-origin) transition-[opacity,scale] duration-125 ease-[cubic-bezier(0.23,1,0.32,1)]',
                'data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0',
                className
              )}
            />
          }
        >
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}
