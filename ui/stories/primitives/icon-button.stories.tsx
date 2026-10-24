import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbDots, TbMoon, TbSettings } from 'react-icons/tb';

import { IconButton } from '@/ui/primitives/icon-button.tsx';

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Settings', children: <TbSettings className="size-3.5" /> },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => {
    return (
      <div className="flex items-center gap-1">
        <IconButton aria-label="Theme">
          <TbMoon className="size-3.5" />
        </IconButton>
        <IconButton aria-label="More" aria-pressed={true}>
          <TbDots className="size-3.5" />
        </IconButton>
        <IconButton aria-label="Settings" disabled>
          <TbSettings className="size-3.5" />
        </IconButton>
      </div>
    );
  },
};
