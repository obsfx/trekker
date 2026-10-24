import { Menu } from '@base-ui/react/menu';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { TbCheck } from 'react-icons/tb';

interface MenuCheckItemProps {
  checked: boolean;
  icon?: ReactNode;
  onToggle: () => void;
  children: ReactNode;
}

export function MenuCheckItem({ checked, icon, onToggle, children }: MenuCheckItemProps) {
  return (
    <Menu.CheckboxItem
      checked={checked}
      closeOnClick={false}
      onCheckedChange={onToggle}
      className="flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-3 px-1.5 outline-none data-highlighted:bg-canvas-2"
    >
      <span
        className={clsx(
          'flex size-3.5 shrink-0 items-center justify-center rounded-2 border',
          checked ? 'border-primary bg-primary text-primary-contrast' : 'border-line-body'
        )}
      >
        {checked ? <TbCheck className="size-3" /> : null}
      </span>
      {icon ? <span className="flex shrink-0 text-fg-3">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Menu.CheckboxItem>
  );
}
