import type { Meta, StoryObj } from '@storybook/react-vite';

import { EpicTasks } from '@/ui/components/epic/epic-tasks.tsx';
import { SAMPLE_STATUS_COUNTS } from '@/ui/stories/fixtures/sample-summaries.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Epic/EpicTasks',
  component: EpicTasks,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  args: { epicId: 'EPIC-2', counts: SAMPLE_STATUS_COUNTS },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EpicTasks>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
