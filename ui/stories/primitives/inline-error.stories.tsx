import type { Meta, StoryObj } from '@storybook/react-vite';

import { InlineError } from '@/ui/primitives/inline-error.tsx';

const meta = {
  title: 'Primitives/InlineError',
  component: InlineError,
  args: { children: 'A title is required.' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof InlineError>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
