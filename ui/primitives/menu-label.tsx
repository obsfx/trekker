import type { ReactNode } from 'react';

interface MenuLabelProps {
  children: ReactNode;
}

export function MenuLabel({ children }: MenuLabelProps) {
  return (
    <div className="px-1.5 pt-1 pb-0.5 text-micro font-semibold tracking-wide text-fg-4 uppercase">
      {children}
    </div>
  );
}
