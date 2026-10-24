import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tallies } from '@/ui/lib/tallies.ts';
import { BoardCardView } from '@/ui/primitives/board-card-view.tsx';
import { StoryItems } from '@/ui/stories/fixtures/story-items.ts';

const meta = {
  title: 'Primitives/BoardCardView',
  component: BoardCardView,
  args: { item: StoryItems.task(), updatedLabel: '3h', progress: null },
  decorators: [
    (Story) => {
      return (
        <div className="w-72 bg-canvas-1 p-2">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoardCardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Blocked: Story = { args: { item: StoryItems.blockedTask() } };

export const Epic: Story = {
  args: { item: StoryItems.epic(), progress: Tallies.view(StoryItems.epic().progress) },
};

export const LongTitle: Story = { args: { item: StoryItems.longTitle() } };

export const Dragging: Story = { args: { dragging: true } };
