import type { Meta, StoryObj } from '@storybook/react-vite';

import { CheckField } from '@/ui/primitives/check-field.tsx';

const meta = {
  title: 'Primitives/CheckField',
  component: CheckField,
  args: { children: 'Create another' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CheckField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };
