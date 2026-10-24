import { Menu } from '@base-ui/react/menu';
import type { ReactNode } from 'react';
import { TbChevronDown, TbX } from 'react-icons/tb';

import { useCheckMenu } from '@/ui/hooks/use-check-menu.ts';
import type { LabeledOption } from '@/ui/lib/labeled-option.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuAction } from '@/ui/primitives/menu-action.tsx';
import { MenuCheckItem } from '@/ui/primitives/menu-check-item.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuSeparator } from '@/ui/primitives/menu-separator.tsx';

interface CheckMenuOption<T> extends LabeledOption<T> {
  icon?: ReactNode;
}

interface CheckMenuProps<T> {
  label: string;
  options: readonly CheckMenuOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}

export function CheckMenu<T extends string | number>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: CheckMenuProps<T>) {
  const { summary, active } = useCheckMenu(selected, options);
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant={active ? 'subtle' : 'text'} aria-label={label} />}>
        {label}
        {active && <span className="font-normal">{summary}</span>}
        <TbChevronDown className="size-3" />
      </Menu.Trigger>
      <MenuPopupSurface align="start">
        {options.map((option) => {
          return (
            <MenuCheckItem
              key={String(option.value)}
              checked={selected.includes(option.value)}
              icon={option.icon}
              onToggle={() => {
                onToggle(option.value);
              }}
            >
              {option.label}
            </MenuCheckItem>
          );
        })}
        {selected.length > 0 && (
          <>
            <MenuSeparator />
            <MenuAction icon={<TbX className="size-3.5" />} onClick={onClear}>
              Clear {label.toLowerCase()}
            </MenuAction>
          </>
        )}
      </MenuPopupSurface>
    </Menu.Root>
  );
}
