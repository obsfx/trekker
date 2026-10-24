import type { ReactNode } from 'react';

interface NavTabsProps {
  children: ReactNode;
}

export function NavTabs({ children }: NavTabsProps) {
  return <nav className="flex h-full items-stretch gap-1">{children}</nav>;
}
