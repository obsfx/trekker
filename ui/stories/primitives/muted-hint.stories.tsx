import type { Meta, StoryObj } from '@storybook/react-vite';

import { MutedHint } from '@/ui/primitives/muted-hint.tsx';

const meta = {
  title: 'Primitives/MutedHint',
  component: MutedHint,
  args: { children: 'No matches' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MutedHint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
