import type { Meta, StoryObj } from '@storybook/react-vite';

import { MetaText } from '@/ui/primitives/meta-text.tsx';

const meta = {
  title: 'Primitives/MetaText',
  component: MetaText,
  args: { children: 'Created 3h ago, updated 12m ago', title: 'Oct 24, 2026 11:20' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MetaText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
