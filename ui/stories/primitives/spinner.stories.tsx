import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from '@/ui/primitives/spinner.tsx';

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
