import { Tooltip } from '@base-ui/react/tooltip';
import type { ReactNode } from 'react';

interface TooltipPopupSurfaceProps {
  children: ReactNode;
}

export function TooltipPopupSurface({ children }: TooltipPopupSurfaceProps) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner side="top" sideOffset={4} className="z-50">
        <Tooltip.Popup className="max-w-80 rounded-3 border border-line bg-canvas px-1.5 py-1 text-xs wrap-anywhere text-fg-1 shadow-lg">
          {children}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  );
}
