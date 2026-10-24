import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextAreaField } from '@/ui/primitives/text-area-field.tsx';

const meta = {
  title: 'Primitives/TextAreaField',
  component: TextAreaField,
  args: { rows: 4, placeholder: 'Write a comment, markdown supported', 'aria-label': 'Comment' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TextAreaField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mono: Story = {
  args: { mono: true, defaultValue: '## Plan\n\n- One feed per server' },
};

export const Invalid: Story = { args: { invalid: true } };
