import type { Meta, StoryObj } from '@storybook/react-vite';

import { BareInput } from '@/ui/primitives/bare-input.tsx';
import { InputFrame } from '@/ui/primitives/input-frame.tsx';

const meta = {
  title: 'Primitives/InputFrame',
  component: InputFrame,
  args: {
    className: 'w-64',
    children: <BareInput defaultValue="trekker serve command and REST API" />,
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof InputFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = { args: { invalid: true } };
