import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryChange } from '@/ui/primitives/history-change.tsx';

const meta = {
  title: 'Primitives/HistoryChange',
  component: HistoryChange,
  args: { field: 'status', from: 'Todo', to: 'In progress' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof HistoryChange>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FromTo: Story = {};

export const OnlyNewValue: Story = { args: { field: 'depends on', from: null, to: 'TREK-131' } };

export const FieldOnly: Story = { args: { field: 'description', from: null, to: null } };
