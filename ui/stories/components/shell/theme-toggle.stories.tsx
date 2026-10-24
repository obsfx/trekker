import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeToggle } from '@/ui/components/shell/theme-toggle.tsx';

const meta = {
  title: 'Components/Shell/ThemeToggle',
  component: ThemeToggle,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
