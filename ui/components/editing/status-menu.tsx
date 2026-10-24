import { Menu } from '@base-ui/react/menu';
import { TbChevronDown } from 'react-icons/tb';

import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

interface StatusMenuProps {
  value: ItemStatus;
  statuses: readonly ItemStatus[];
  onChange: (status: ItemStatus) => void;
}

export function StatusMenu({ value, statuses, onChange }: StatusMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={<Button variant="text" aria-label="Status" className="font-normal text-fg-1" />}
      >
        <StatusIcon status={value} />
        {ItemStatuses.label(value)}
        <TbChevronDown className="size-3 text-fg-4" />
      </Menu.Trigger>
      <MenuPopupSurface align="start">
        <Menu.RadioGroup
          value={value}
          onValueChange={(next: ItemStatus) => {
            onChange(next);
          }}
        >
          {statuses.map((status) => {
            return (
              <MenuRadioOption key={status} value={status} icon={<StatusIcon status={status} />}>
                {ItemStatuses.label(status)}
              </MenuRadioOption>
            );
          })}
        </Menu.RadioGroup>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
