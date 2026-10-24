import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryPage } from '@/ui/layouts/history-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Layouts/HistoryPage',
  component: HistoryPage,
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/history">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HistoryPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
