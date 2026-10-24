import type { Meta, StoryObj } from '@storybook/react-vite';

import { TaskDocument } from '@/ui/components/task/task-document.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';
import { WithTask } from '@/ui/stories/support/with-task.tsx';

interface TaskDocumentStoryProps {
  id: string;
}

function TaskDocumentStory({ id }: TaskDocumentStoryProps) {
  return (
    <WithTask id={id}>
      {(task) => {
        return <TaskDocument task={task} />;
      }}
    </WithTask>
  );
}

const meta = {
  title: 'Components/Task/TaskDocument',
  component: TaskDocumentStory,
  args: { id: 'TREK-2' },
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/tasks/TREK-2">
          <div className="flex h-screen flex-col">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TaskDocumentStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSubtasks: Story = {};

export const Subtask: Story = { args: { id: 'TREK-3' } };
