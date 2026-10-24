import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardCard } from '@/ui/components/board/board-card.tsx';
import { StoryItems } from '@/ui/stories/fixtures/story-items.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Board/BoardCard',
  component: BoardCard,
  args: { item: StoryItems.task(), reorderable: true, now: StoryItems.now },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="w-72 bg-canvas-1 p-2">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoardCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Epic: Story = { args: { item: StoryItems.epic() } };
