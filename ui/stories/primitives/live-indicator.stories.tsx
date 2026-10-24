import type { Meta, StoryObj } from '@storybook/react-vite';

import { LiveIndicator } from '@/ui/primitives/live-indicator.tsx';

const meta = {
  title: 'Primitives/LiveIndicator',
  component: LiveIndicator,
  args: { state: 'live' },
  argTypes: { state: { control: 'inline-radio', options: ['live', 'connecting', 'offline'] } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LiveIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Live: Story = {};

export const Connecting: Story = { args: { state: 'connecting' } };

export const Offline: Story = { args: { state: 'offline' } };
