import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TbArchive, TbTrash } from 'react-icons/tb';
import { expect, fn, userEvent } from 'storybook/test';

import { ConfirmPopover } from '@/ui/components/shared/confirm-popover.tsx';
import { Button } from '@/ui/primitives/button.tsx';
import { IconButton } from '@/ui/primitives/icon-button.tsx';
import { StoryScreens } from '@/ui/stories/support/story-screens.ts';

interface ConfirmPopoverDemoProps {
  danger: boolean;
  onConfirm: () => void;
}

function ConfirmPopoverDemo({ danger, onConfirm }: ConfirmPopoverDemoProps) {
  const [open, setOpen] = useState(false);
  if (danger) {
    return (
      <div className="flex h-60 justify-end p-3">
        <ConfirmPopover
          open={open}
          title="Delete TREK-131?"
          description="The task, its subtasks and comments are removed. This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          trigger={
            <IconButton aria-label="Delete TREK-131">
              <TbTrash className="size-3.5" />
            </IconButton>
          }
          onConfirm={onConfirm}
          onOpenChange={setOpen}
        />
      </div>
    );
  }
  return (
    <div className="flex h-60 justify-end p-3">
      <ConfirmPopover
        open={open}
        title="Archive completed items?"
        description="Every completed task and epic moves to Archived. They stay searchable and you can change their status back."
        confirmLabel="Archive"
        trigger={
          <Button variant="text">
            <TbArchive className="size-3.5" />
            Archive completed
          </Button>
        }
        onConfirm={onConfirm}
        onOpenChange={setOpen}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Shared/ConfirmPopover',
  component: ConfirmPopoverDemo,
  args: { danger: false, onConfirm: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConfirmPopoverDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = { args: { danger: true } };

export const ConfirmsFromTrigger: Story = {
  play: async ({ canvasElement, args }) => {
    const { body } = await StoryScreens.openFromButton(canvasElement, 'Archive completed');
    const confirm = await body.findByRole('button', { name: 'Archive' });
    await userEvent.click(confirm);
    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

export const CancelsWithEscape: Story = {
  args: { danger: true },
  play: async ({ canvasElement, args }) => {
    const { body } = await StoryScreens.openFromButton(canvasElement, 'Delete TREK-131');
    await body.findByText('Delete TREK-131?');
    await userEvent.keyboard('{Escape}');
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};
