import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryEventRow } from '@/ui/components/history/history-event-row.tsx';
import { STORY_HISTORY_EVENTS } from '@/ui/stories/support/story-history-events.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/History/HistoryEventRow',
  component: HistoryEventRow,
  args: { event: STORY_HISTORY_EVENTS[0] ?? STORY_HISTORY_EVENTS.at(-1) },
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/history">
          <Story />
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HistoryEventRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StatusAndPriority: Story = {};

export const AllKinds: Story = {
  render: () => {
    return (
      <div className="flex flex-col">
        {STORY_HISTORY_EVENTS.map((event) => {
          return <HistoryEventRow key={event.id} event={event} />;
        })}
      </div>
    );
  },
};
