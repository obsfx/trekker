import { Menu } from '@base-ui/react/menu';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbPencil, TbSortDescending, TbTrash } from 'react-icons/tb';
import { fn } from 'storybook/test';

import { Button } from '@/ui/primitives/button.tsx';
import { MenuAction } from '@/ui/primitives/menu-action.tsx';
import { MenuLabel } from '@/ui/primitives/menu-label.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuRadioOption } from '@/ui/primitives/menu-radio-option.tsx';

function MenuDemo() {
  return (
    <div className="flex gap-2">
      <Menu.Root>
        <Menu.Trigger render={<Button variant="text" />}>
          <TbSortDescending className="size-3.5" />
          Updated
        </Menu.Trigger>
        <MenuPopupSurface align="start">
          <MenuLabel>Sort by</MenuLabel>
          <Menu.RadioGroup defaultValue="updated">
            <MenuRadioOption value="updated">Last updated</MenuRadioOption>
            <MenuRadioOption value="created">Created</MenuRadioOption>
            <MenuRadioOption value="priority">Priority</MenuRadioOption>
            <MenuRadioOption value="title">Title</MenuRadioOption>
          </Menu.RadioGroup>
        </MenuPopupSurface>
      </Menu.Root>
      <Menu.Root>
        <Menu.Trigger render={<Button variant="secondary" />}>Actions</Menu.Trigger>
        <MenuPopupSurface align="start">
          <MenuAction icon={<TbPencil className="size-3.5" />} onClick={fn()}>
            Edit
          </MenuAction>
          <MenuAction icon={<TbTrash className="size-3.5" />} tone="danger" onClick={fn()}>
            Delete
          </MenuAction>
        </MenuPopupSurface>
      </Menu.Root>
    </div>
  );
}

const meta = {
  title: 'Primitives/Menu',
  component: MenuDemo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
