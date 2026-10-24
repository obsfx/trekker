import { Menu } from '@base-ui/react/menu';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface MenuActionProps {
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  onClick: () => void;
  children: ReactNode;
}

export function MenuAction({ icon, tone = 'default', onClick, children }: MenuActionProps) {
  return (
    <Menu.Item
      onClick={onClick}
      className={clsx(
        'flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-3 px-1.5 outline-none',
        {
          'text-danger-fg data-highlighted:bg-danger-subtle': tone === 'danger',
          'data-highlighted:bg-canvas-2': tone !== 'danger',
        }
      )}
    >
      {icon ? <span className="flex shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Menu.Item>
  );
}
