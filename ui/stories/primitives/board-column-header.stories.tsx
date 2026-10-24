import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { BoardColumnHeader } from '@/ui/primitives/board-column-header.tsx';

const meta = {
  title: 'Primitives/BoardColumnHeader',
  component: BoardColumnHeader,
  args: { status: 'todo', total: 4182, onAdd: fn() },
  argTypes: { status: { control: 'select', options: ItemStatuses.all } },
  decorators: [
    (Story) => {
      return (
        <div className="w-72 bg-canvas-1 p-1.5">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoardColumnHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Todo: Story = {};

export const InProgress: Story = { args: { status: 'in_progress', total: 37 } };
