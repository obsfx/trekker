import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeadingInput } from '@/ui/primitives/heading-input.tsx';

const meta = {
  title: 'Primitives/HeadingInput',
  component: HeadingInput,
  args: { defaultValue: 'Event feed and SSE with replay after reconnect', 'aria-label': 'Title' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof HeadingInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
