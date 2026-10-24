import { Menu } from '@base-ui/react/menu';
import { TbChevronDown } from 'react-icons/tb';

import { Priorities, type Priority } from '@/ui/lib/priorities.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';

interface PriorityMenuProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PriorityMenu({ value, onChange }: PriorityMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={<Button variant="text" aria-label="Priority" className="font-normal text-fg-1" />}
      >
        <PriorityIcon priority={value} />
        {Priorities.describe(value)}
        <TbChevronDown className="size-3 text-fg-4" />
      </Menu.Trigger>
      <MenuPopupSurface align="start">
        <Menu.RadioGroup
          value={String(value)}
          onValueChange={(next: string) => {
            const priority = Priorities.all.find((option) => {
              return String(option) === next;
            });
            if (priority !== undefined) {
              onChange(priority);
            }
          }}
        >
          {Priorities.all.map((priority) => {
            return (
              <MenuRadioOption
                key={priority}
                value={String(priority)}
                icon={<PriorityIcon priority={priority} />}
              >
                {Priorities.describe(priority)}
              </MenuRadioOption>
            );
          })}
        </Menu.RadioGroup>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
