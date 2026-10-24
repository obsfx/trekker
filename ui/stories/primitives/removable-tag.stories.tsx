import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { RemovableTag } from '@/ui/primitives/removable-tag.tsx';

const meta = {
  title: 'Primitives/RemovableTag',
  component: RemovableTag,
  args: { tag: 'backend', onRemove: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof RemovableTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
