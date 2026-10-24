import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { CreateDialog } from '@/ui/components/create/create-dialog.tsx';
import type { CreateDefaults } from '@/ui/lib/create-forms.ts';
import { useCreateDialogStore } from '@/ui/store/create-dialog-store.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

interface OpenCreateDialogProps {
  defaults: Partial<CreateDefaults>;
}

function OpenCreateDialog({ defaults }: OpenCreateDialogProps) {
  const show = useCreateDialogStore((state) => {
    return state.show;
  });
  useEffect(() => {
    show(defaults);
  }, [show, defaults]);
  return <CreateDialog />;
}

const meta = {
  title: 'Components/Create/CreateDialog',
  component: OpenCreateDialog,
  args: { defaults: { kind: 'task' } },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="h-screen">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OpenCreateDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Subtask: Story = { args: { defaults: { kind: 'subtask' } } };

export const Epic: Story = { args: { defaults: { kind: 'epic' } } };

export const InEpicColumn: Story = {
  args: { defaults: { kind: 'task', status: 'in_progress', epicId: 'EPIC-1' } },
};
