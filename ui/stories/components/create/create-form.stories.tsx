import { Dialog } from '@base-ui/react/dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { CreateForm } from '@/ui/components/create/create-form.tsx';
import { DialogSurface } from '@/ui/primitives/dialog-surface.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Create/CreateForm',
  component: CreateForm,
  args: {
    defaults: { kind: 'task', status: 'todo', epicId: null, parentTaskId: null },
    onDone: fn(),
  },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Dialog.Root open>
            <Dialog.Portal>
              <Dialog.Popup render={<DialogSurface />}>
                <Story />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CreateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Epic: Story = {
  args: { defaults: { kind: 'epic', status: 'todo', epicId: null, parentTaskId: null } },
};

export const SubtaskOfTask: Story = {
  args: { defaults: { kind: 'subtask', status: 'todo', epicId: null, parentTaskId: 'TREK-2' } },
};

export const RequiresTitle: Story = {
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const button = await body.findByRole('button', { name: 'Create task' });
    await userEvent.click(button);
    const message = await body.findByText('A title is required.');
    await expect(message).toBeInTheDocument();
    await expect(args.onDone).not.toHaveBeenCalled();
  },
};

export const CreatesTask: Story = {
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    const field = await body.findByLabelText('Title');
    await userEvent.type(field, 'Ship the web UI');
    await userEvent.click(body.getByRole('button', { name: 'Create task' }));
    await expect(args.onDone).toHaveBeenCalled();
  },
};

export const SubtaskRequiresParent: Story = {
  args: { defaults: { kind: 'subtask', status: 'todo', epicId: null, parentTaskId: null } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const field = await body.findByLabelText('Title');
    await userEvent.type(field, 'Orphan');
    await userEvent.click(body.getByRole('button', { name: 'Create subtask' }));
    const message = await body.findByText('Choose the parent task for this subtask.');
    await expect(message).toBeInTheDocument();
  },
};
