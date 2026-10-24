import type { Meta, StoryObj } from '@storybook/react-vite';

import { TrekkerLogo } from '@/ui/primitives/trekker-logo.tsx';

const meta = {
  title: 'Primitives/TrekkerLogo',
  component: TrekkerLogo,
  args: { className: 'size-4 text-primary' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TrekkerLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TopBarSize: Story = {};

export const Large: Story = { args: { className: 'size-10 text-fg' } };
