import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbX } from 'react-icons/tb';

import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { LinkedItemRow } from '@/ui/primitives/linked-item-row.tsx';

const meta = {
  title: 'Primitives/LinkedItemRow',
  component: LinkedItemRow,
  args: {
    itemId: 'TREK-142',
    status: 'in_progress',
    priority: 1,
    done: false,
    title: 'Replay with ?after and Last-Event-ID',
    action: (
      <IconButton aria-label="Remove" className="size-5">
        <TbX className="size-3" />
      </IconButton>
    ),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LinkedItemRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Done: Story = {
  args: { status: 'completed', done: true, title: 'Poll PRAGMA data_version' },
};
