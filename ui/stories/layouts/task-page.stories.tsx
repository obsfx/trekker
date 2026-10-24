import type { Meta, StoryObj } from '@storybook/react-vite';

import { TaskPage } from '@/ui/layouts/task-page.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';
import { TaskStorySeed } from '@/ui/stories/support/task-story-seed.ts';

const meta = {
  title: 'Layouts/TaskPage',
  component: TaskPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TaskPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/tasks/TREK-2" prepare={TaskStorySeed.prepare}>
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
};

export const Subtask: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/tasks/TREK-3" prepare={TaskStorySeed.prepare}>
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
};

export const Missing: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/tasks/TREK-99999">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
};
