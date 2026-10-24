import { Menu } from '@base-ui/react/menu';
import type { ReactNode } from 'react';
import { TbCheck } from 'react-icons/tb';

interface MenuRadioOptionProps {
  value: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function MenuRadioOption({ value, icon, children }: MenuRadioOptionProps) {
  return (
    <Menu.RadioItem
      value={value}
      closeOnClick={true}
      className="flex h-6 w-full cursor-pointer items-center gap-1.5 rounded-3 px-1.5 outline-none data-highlighted:bg-canvas-2"
    >
      {icon ? <span className="flex shrink-0 text-fg-3">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Menu.RadioItemIndicator className="flex shrink-0 text-primary-fg">
        <TbCheck aria-hidden="true" className="size-3.5" />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  );
}
