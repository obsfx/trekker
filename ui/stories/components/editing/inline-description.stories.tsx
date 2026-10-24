import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { InlineDescription } from '@/ui/components/editing/inline-description.tsx';

interface InlineDescriptionDemoProps {
  initial: string | null;
}

function InlineDescriptionDemo({ initial }: InlineDescriptionDemoProps) {
  const [description, setDescription] = useState(initial);
  return (
    <div className="max-w-2xl">
      <InlineDescription
        value={description}
        placeholder="Add a description"
        onSave={setDescription}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Editing/InlineDescription',
  component: InlineDescriptionDemo,
  args: {
    initial:
      'Rewrite the dashboard inside the trekker CLI.\n\n- Single embedded HTML\n- REST and SSE\n- Storybook-first components',
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof InlineDescriptionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {};

export const Empty: Story = { args: { initial: null } };

export const SavesWithModifierEnter: Story = {
  args: { initial: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Add a description'));
    await userEvent.type(canvas.getByLabelText('Description'), 'Plain **markdown**');
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}');
    const message = await canvas.findByText('markdown');
    await expect(message).toBeInTheDocument();
  },
};

export const ClearsWhenSavedBlank: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('Edit description'));
    await userEvent.clear(canvas.getByLabelText('Description'));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const message = await canvas.findByText('Add a description');
    await expect(message).toBeInTheDocument();
  },
};
