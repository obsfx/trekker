import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardView } from '@/ui/components/board/board-view.tsx';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Board/BoardView',
  component: BoardView,
  args: { view: { kind: 'all', epicId: null, sort: ItemQueries.manualSort } },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="flex h-screen">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Manual: Story = {};

export const EpicsOnly: Story = {
  args: { view: { kind: 'epic', epicId: null, sort: ItemQueries.manualSort } },
};
