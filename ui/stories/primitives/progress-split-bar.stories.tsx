import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusCounts } from '@/ui/lib/status-counts.ts';
import { ProgressSplitBar } from '@/ui/primitives/progress-split-bar.tsx';
import { SAMPLE_STATUS_COUNTS } from '@/ui/stories/fixtures/sample-summaries.ts';

const meta = {
  title: 'Primitives/ProgressSplitBar',
  component: ProgressSplitBar,
  args: {
    counts: SAMPLE_STATUS_COUNTS,
    segments: StatusCounts.segments(SAMPLE_STATUS_COUNTS),
    summary: '7 of 18 tasks done',
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProgressSplitBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    counts: { todo: 0, in_progress: 0, completed: 0, wont_fix: 0, archived: 0 },
    segments: [],
    summary: 'No tasks yet',
  },
};
