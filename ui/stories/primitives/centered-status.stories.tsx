import type { Meta, StoryObj } from '@storybook/react-vite';

import { CenteredStatus } from '@/ui/primitives/centered-status.tsx';

const meta = {
  title: 'Primitives/CenteredStatus',
  component: CenteredStatus,
  args: { children: 'This page does not exist.' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CenteredStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
