import { Menu } from '@base-ui/react/menu';
import type { IconType } from 'react-icons';
import { TbSortAscending, TbSortDescending } from 'react-icons/tb';

import {
  ItemQueries,
  type ItemSort,
  type SortDirection,
  type SortField,
} from '@/ui/lib/item-queries.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuLabel } from '@/ui/primitives/menu-label.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';
import { MenuSeparator } from '@/ui/primitives/menu-separator.tsx';

const SORT_ICONS: Record<SortDirection, IconType> = {
  asc: TbSortAscending,
  desc: TbSortDescending,
};

interface SortMenuProps {
  sort: ItemSort;
  fields: readonly SortField[];
  onChange: (sort: ItemSort) => void;
}

export function SortMenu({ sort, fields, onChange }: SortMenuProps) {
  const SortIcon = SORT_ICONS[sort.direction];
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant="text" aria-label="Sort" />}>
        <SortIcon className="size-3.5" />
        {ItemQueries.sortLabel(sort.field)}
      </Menu.Trigger>
      <MenuPopupSurface align="end">
        <MenuLabel>Sort by</MenuLabel>
        <Menu.RadioGroup
          value={sort.field}
          onValueChange={(field: SortField) => {
            onChange({ ...sort, field });
          }}
        >
          {fields.map((field) => {
            return (
              <MenuRadioOption key={field} value={field}>
                {ItemQueries.sortLabel(field)}
              </MenuRadioOption>
            );
          })}
        </Menu.RadioGroup>
        <MenuSeparator />
        <Menu.RadioGroup
          value={sort.direction}
          onValueChange={(direction: SortDirection) => {
            onChange({ ...sort, direction });
          }}
        >
          <MenuRadioOption value="asc" icon={<TbSortAscending className="size-3.5" />}>
            Ascending
          </MenuRadioOption>
          <MenuRadioOption value="desc" icon={<TbSortDescending className="size-3.5" />}>
            Descending
          </MenuRadioOption>
        </Menu.RadioGroup>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
