import { Menu } from '@base-ui/react/menu';
import { TbChevronDown } from 'react-icons/tb';

import { CreateForms, type CreateKind } from '@/ui/lib/create-forms.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';

interface CreateKindMenuProps {
  value: CreateKind;
  onChange: (kind: CreateKind) => void;
}

export function CreateKindMenu({ value, onChange }: CreateKindMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="secondary" aria-label="Type" />}>
        {CreateForms.kindLabel(value)}
        <TbChevronDown className="size-3 text-fg-4" />
      </Menu.Trigger>
      <MenuPopupSurface align="start">
        <Menu.RadioGroup value={value} onValueChange={onChange}>
          {CreateForms.kinds.map((kind) => {
            return (
              <MenuRadioOption key={kind.value} value={kind.value}>
                {kind.label}
              </MenuRadioOption>
            );
          })}
        </Menu.RadioGroup>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
