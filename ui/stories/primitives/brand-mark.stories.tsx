import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandMark } from '@/ui/primitives/brand-mark.tsx';

const meta = {
  title: 'Primitives/BrandMark',
  component: BrandMark,
  args: { projectName: 'trekker', projectPath: '~/workspace/trekker' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BrandMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
