import type { Meta, StoryObj } from '@storybook/react-vite';

import { AddInput } from '@/ui/primitives/add-input.tsx';

const meta = {
  title: 'Primitives/AddInput',
  component: AddInput,
  args: { placeholder: 'Add subtask, Enter to create', 'aria-label': 'Add subtask' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AddInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
