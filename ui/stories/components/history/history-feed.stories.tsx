import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryFeed } from '@/ui/components/history/history-feed.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/History/HistoryFeed',
  component: HistoryFeed,
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/history" latencyMs={250}>
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HistoryFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
