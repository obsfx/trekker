import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardCardView } from '@/ui/primitives/board-card-view.tsx';
import { DropIndicator } from '@/ui/primitives/drop-indicator.tsx';
import { StoryItems } from '@/ui/stories/fixtures/story-items.ts';

const meta = {
  title: 'Primitives/DropIndicator',
  component: DropIndicator,
  args: { edge: 'top' },
  decorators: [
    (Story) => {
      return (
        <div className="w-72 bg-canvas-1 p-3">
          <div className="relative">
            <BoardCardView item={StoryItems.task()} updatedLabel="3h" progress={null} />
            <Story />
          </div>
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DropIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Top: Story = {};

export const Bottom: Story = { args: { edge: 'bottom' } };
