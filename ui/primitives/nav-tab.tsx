import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

interface NavTabProps {
  to: string;
  end?: boolean;
  icon: ReactNode;
  label: string;
}

export function NavTab({ to, end, icon, label }: NavTabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) => {
        return clsx(
          'flex items-center gap-1.5 border-b-2 px-2 text-xs no-underline outline-none focus-visible:focus-ring',
          {
            'border-primary font-medium text-fg': isActive,
            'border-transparent text-fg-3 hover:text-fg-1': !isActive,
          }
        );
      }}
    >
      {icon}
      <span className="max-md:sr-only">{label}</span>
    </NavLink>
  );
}
