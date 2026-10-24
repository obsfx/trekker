import { Menu } from '@base-ui/react/menu';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Button } from '@/ui/primitives/button.tsx';
import { MenuAction } from '@/ui/primitives/menu-action.tsx';
import { MenuPopupSurface } from '@/ui/primitives/menu-popup-surface.tsx';
import { MenuSeparator } from '@/ui/primitives/menu-separator.tsx';

const meta = {
  title: 'Primitives/MenuSeparator',
  component: MenuSeparator,
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <Menu.Root defaultOpen>
        <Menu.Trigger render={<Button variant="secondary" />}>Actions</Menu.Trigger>
        <MenuPopupSurface align="start">
          <MenuAction onClick={fn()}>Open</MenuAction>
          <MenuSeparator />
          <MenuAction tone="danger" onClick={fn()}>
            Delete
          </MenuAction>
        </MenuPopupSurface>
      </Menu.Root>
    );
  },
} satisfies Meta<typeof MenuSeparator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
