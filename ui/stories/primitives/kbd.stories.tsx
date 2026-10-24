import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd } from '@/ui/primitives/kbd.tsx';

const meta = {
  title: 'Primitives/Kbd',
  component: Kbd,
  args: { children: '/' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
