import type { Meta, StoryObj } from '@storybook/react-vite';

import { TagChip } from '@/ui/primitives/tag-chip.tsx';

const meta = {
  title: 'Primitives/TagChip',
  component: TagChip,
  args: { children: 'performance' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TagChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
