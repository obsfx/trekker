import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActivityCounts } from '@/ui/primitives/activity-counts.tsx';

const meta = {
  title: 'Primitives/ActivityCounts',
  component: ActivityCounts,
  args: { subtasks: { total: 5, done: 2 }, blockedBy: 1, commentCount: 12 },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ActivityCounts>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { subtasks: { total: 0, done: 0 }, blockedBy: 0, commentCount: 0 },
};
