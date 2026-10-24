import { Menu } from '@base-ui/react/menu';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

import { MenuSurface } from '@/ui/primitives/menu-surface.tsx';

interface MenuPopupSurfaceProps {
  align: 'start' | 'end';
  className?: string;
  children: ReactNode;
}

export function MenuPopupSurface({ align, className, children }: MenuPopupSurfaceProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner side="bottom" align={align} sideOffset={4} className="z-50">
        <Menu.Popup
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
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}
