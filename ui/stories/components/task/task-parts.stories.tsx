import type { Meta, StoryObj } from '@storybook/react-vite';
import dayjs from 'dayjs';
import { expect, userEvent, within } from 'storybook/test';

import { CommentComposer } from '@/ui/components/task/comment-composer.tsx';
import { CommentItem } from '@/ui/components/task/comment-item.tsx';
import { CommentThread } from '@/ui/components/task/comment-thread.tsx';
import { DeleteTaskButton } from '@/ui/components/task/delete-task-button.tsx';
import { DependencySection } from '@/ui/components/task/dependency-section.tsx';
import { SubtaskSection } from '@/ui/components/task/subtask-section.tsx';
import { TaskActivity } from '@/ui/components/task/task-activity.tsx';
import { TaskBreadcrumb } from '@/ui/components/task/task-breadcrumb.tsx';
import { TaskProperties } from '@/ui/components/task/task-properties.tsx';
import { TaskTabs } from '@/ui/components/task/task-tabs.tsx';
import { useTaskProperties } from '@/ui/hooks/use-task-properties.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';
import { TaskStorySeed } from '@/ui/stories/support/task-story-seed.ts';
import { WithTask } from '@/ui/stories/support/with-task.tsx';

interface PropertiesDemoProps {
  task: TaskDetail;
}

function PropertiesDemo({ task }: PropertiesDemoProps) {
  const properties = useTaskProperties(task);
  return <TaskProperties task={task} properties={properties} />;
}

const meta = {
  title: 'Components/Task/Parts',
  decorators: [
    (Story) => {
      return (
        <StoryServices path="/tasks/TREK-2" prepare={TaskStorySeed.prepare}>
          <div className="max-w-3xl p-4">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Breadcrumb: Story = {
  render: () => {
    return (
      <WithTask id="TREK-3">
        {(task) => {
          return <TaskBreadcrumb task={task} />;
        }}
      </WithTask>
    );
  },
};

export const Properties: Story = {
  render: () => {
    return (
      <WithTask id={TaskStorySeed.taskId}>
        {(task) => {
          return <PropertiesDemo task={task} />;
        }}
      </WithTask>
    );
  },
};

export const Subtasks: Story = {
  render: () => {
    return (
      <WithTask id={TaskStorySeed.taskId}>
        {(task) => {
          return <SubtaskSection task={task} />;
        }}
      </WithTask>
    );
  },
};

export const Dependencies: Story = {
  render: () => {
    return (
      <WithTask id={TaskStorySeed.taskId}>
        {(task) => {
          return <DependencySection task={task} />;
        }}
      </WithTask>
    );
  },
};

export const Comments: Story = {
  render: () => {
    return <CommentThread taskId={TaskStorySeed.taskId} />;
  },
};

export const SingleComment: Story = {
  render: () => {
    return (
      <CommentItem
        comment={{
          id: 'CMT-900',
          taskId: TaskStorySeed.taskId,
          author: 'agent',
          content: 'Replay is capped at **2000** rows; past that the stream sends `reset`.',
          createdAt: dayjs().valueOf() - 600_000,
          updatedAt: dayjs().valueOf() - 300_000,
        }}
      />
    );
  },
};

export const Composer: Story = {
  render: () => {
    return <CommentComposer taskId={TaskStorySeed.taskId} />;
  },
};

export const ComposerExpandsOnFocus: Story = {
  render: () => {
    return <CommentComposer taskId={TaskStorySeed.taskId} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Comment' })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByLabelText('New comment'));
    const send = await canvas.findByRole('button', { name: 'Comment' });
    await expect(send).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('New comment'), 'Ship it');
    await expect(send).toBeEnabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(canvas.getByLabelText('New comment')).toHaveValue('');
  },
};

export const Activity: Story = {
  render: () => {
    return <TaskActivity taskId={TaskStorySeed.taskId} />;
  },
};

export const Tabs: Story = {
  render: () => {
    return (
      <WithTask id={TaskStorySeed.taskId}>
        {(task) => {
          return <TaskTabs task={task} />;
        }}
      </WithTask>
    );
  },
};

export const Delete: Story = {
  render: () => {
    return (
      <WithTask id="TREK-5">
        {(task) => {
          return <DeleteTaskButton task={task} />;
        }}
      </WithTask>
    );
  },
};
