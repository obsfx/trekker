import type { Meta, StoryObj } from '@storybook/react-vite';

import { BoardColumn } from '@/ui/components/board/board-column.tsx';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { StoryItems } from '@/ui/stories/fixtures/story-items.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Board/BoardColumn',
  component: BoardColumn,
  args: {
    view: { kind: 'all', epicId: null, sort: ItemQueries.manualSort },
    status: 'completed',
    now: StoryItems.now,
  },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="flex h-[36rem] w-80">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BoardColumn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Completed: Story = {};

export const Todo: Story = { args: { status: 'todo' } };

export const SortedByPriority: Story = {
  args: {
    view: { kind: 'task', epicId: null, sort: { field: 'priority', direction: 'asc' } },
  },
};
