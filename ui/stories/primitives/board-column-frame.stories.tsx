import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardColumnFrame } from '@/ui/primitives/board-column-frame.tsx';
import { ColumnPlaceholder } from '@/ui/primitives/column-placeholder.tsx';

const meta = {
  title: 'Primitives/BoardColumnFrame',
  component: BoardColumnFrame,
  args: {
    highlighted: false,
    className: 'h-64 w-72 flex-none',
    children: <ColumnPlaceholder>Drop cards here</ColumnPlaceholder>,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoardColumnFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Highlighted: Story = { args: { highlighted: true } };
