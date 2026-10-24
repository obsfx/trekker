import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColumnPlaceholder } from '@/ui/primitives/column-placeholder.tsx';

const meta = {
  title: 'Primitives/ColumnPlaceholder',
  component: ColumnPlaceholder,
  args: { children: 'Drop cards here' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ColumnPlaceholder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
