import { Menu } from '@base-ui/react/menu';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Selections } from '@/ui/lib/selections.ts';
import { Button } from '@/ui/primitives/button.tsx';
import { MenuCheckItem } from '@/ui/primitives/menu-check-item.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';

const OPTIONS = ['Epic', 'Task', 'Subtask', 'Comment', 'Dependency'];

function CheckItemsDemo() {
  const [checked, setChecked] = useState(['Task']);
  return (
    <Menu.Root defaultOpen>
      <Menu.Trigger render={<Button variant="text" />}>Type</Menu.Trigger>
      <MenuPopupSurface align="start">
        {OPTIONS.map((option) => {
          return (
            <MenuCheckItem
              key={option}
              checked={checked.includes(option)}
              onToggle={() => {
                setChecked(Selections.toggle(checked, option));
              }}
            >
              {option}
            </MenuCheckItem>
          );
        })}
      </MenuPopupSurface>
    </Menu.Root>
  );
}

const meta = {
  title: 'Primitives/MenuCheckItem',
  component: CheckItemsDemo,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CheckItemsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
