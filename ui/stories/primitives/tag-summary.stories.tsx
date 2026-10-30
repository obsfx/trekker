import type { Meta, StoryObj } from '@storybook/react-vite';

import { TagSummary } from '@/ui/primitives/tag-summary.tsx';

const meta = {
  title: 'Primitives/TagSummary',
  component: TagSummary,
  args: { tags: ['ui', 'board'], className: 'w-48' },
} satisfies Meta<typeof TagSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MoreThanFit: Story = { args: { tags: ['ui', 'board', 'regression', 'performance'] } };

export const LongTags: Story = {
  args: { tags: ['dashboard-performance-regression', 'keyboard-navigation-accessibility'] },
};
