import { Menu } from '@base-ui/react/menu';
import { TbCalendar, TbChevronDown } from 'react-icons/tb';

import { useDateFilterMenu } from '@/ui/hooks/use-date-filter-menu.ts';
import { type DateFilter, type DatePreset, DateRanges } from '@/ui/lib/date-ranges.ts';
import type { DateField } from '@/ui/lib/item-queries.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { DayRangeInputs } from '@/ui/primitives/day-range-inputs.tsx';
import { MenuLabel } from '@/ui/primitives/menu-label.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';
import { SegmentedControl } from '@/ui/primitives/segmented-control.tsx';
import { SegmentedOption } from '@/ui/primitives/segmented-option.tsx';

interface DateFilterMenuProps {
  filter: DateFilter | null;
  fields: readonly DateField[];
  label?: string;
  onChange: (filter: DateFilter | null) => void;
}

export function DateFilterMenu({ filter, fields, label, onChange }: DateFilterMenuProps) {
  const menu = useDateFilterMenu(filter, fields, onChange);
  return (
    <Menu.Root>
      <Menu.Trigger render={<Button variant={menu.active ? 'subtle' : 'text'} aria-label="Date" />}>
        <TbCalendar className="size-3.5" />
        {label ?? DateRanges.fieldLabel(menu.field)}
        {menu.summary ? <span className="font-normal">{menu.summary}</span> : null}
        <TbChevronDown className="size-3" />
      </Menu.Trigger>
      <MenuPopupSurface align="start" className="w-72">
        {fields.length > 1 && (
          <div className="px-1.5 pt-1 pb-1.5">
            <SegmentedControl label="Date field">
              {fields.map((option) => {
                return (
                  <SegmentedOption
                    key={option}
                    active={menu.field === option}
                    onClick={() => {
                      menu.chooseField(option);
                    }}
                  >
                    {DateRanges.fieldLabel(option)}
                  </SegmentedOption>
                );
              })}
            </SegmentedControl>
          </div>
        )}
        <Menu.RadioGroup
          value={menu.preset}
          onValueChange={(next: DatePreset) => {
            menu.choosePreset(next);
          }}
        >
          {DateRanges.presets.map((option) => {
            return (
              <MenuRadioOption key={option} value={option}>
                {DateRanges.presetLabel(option)}
              </MenuRadioOption>
            );
          })}
        </Menu.RadioGroup>
        <MenuLabel>Custom range</MenuLabel>
        <div className="px-1.5 pb-1">
          <DayRangeInputs from={menu.fromDay} to={menu.toDay} onChange={menu.chooseDays} />
        </div>
      </MenuPopupSurface>
    </Menu.Root>
  );
}
