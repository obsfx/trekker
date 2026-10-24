import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent } from 'storybook/test';

import { InlineTitle } from '@/ui/components/editing/inline-title.tsx';
import { StoryScreens } from '@/ui/stories/support/story-screens.ts';

interface InlineTitleDemoProps {
  initial: string;
}

function InlineTitleDemo({ initial }: InlineTitleDemoProps) {
  const [title, setTitle] = useState(initial);
  return (
    <div className="max-w-2xl">
      <InlineTitle value={title} label="Title" onSave={setTitle} />
    </div>
  );
}

const meta = {
  title: 'Components/Editing/InlineTitle',
  component: InlineTitleDemo,
  args: { initial: 'Dashboard rewrite: 10k scale, Storybook-first, Bootstrap 6 look' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof InlineTitleDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SavesTrimmedTitleOnEnter: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, input } = await StoryScreens.startEditing(
      canvasElement,
      'Click to edit',
      'Title'
    );
    await userEvent.clear(input);
    await userEvent.type(input, '  Renamed task  {Enter}');
    const message = await canvas.findByText('Renamed task');
    await expect(message).toBeInTheDocument();
  },
};

export const CancelsOnEscape: Story = {
  play: async ({ canvasElement, args }) => {
    const { canvas, input } = await StoryScreens.startEditing(
      canvasElement,
      'Click to edit',
      'Title'
    );
    await userEvent.type(input, ' draft{Escape}');
    const message = await canvas.findByText(args.initial);
    await expect(message).toBeInTheDocument();
  },
};

export const KeepsTitleWhenBlank: Story = {
  play: async ({ canvasElement, args }) => {
    const { canvas, input } = await StoryScreens.startEditing(
      canvasElement,
      'Click to edit',
      'Title'
    );
    await userEvent.clear(input);
    await userEvent.type(input, '   {Enter}');
    const message = await canvas.findByText(args.initial);
    await expect(message).toBeInTheDocument();
  },
};
