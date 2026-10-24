import type { Meta, StoryObj } from '@storybook/react-vite';

import { DayHeader } from '@/ui/primitives/day-header.tsx';

const meta = {
  title: 'Primitives/DayHeader',
  component: DayHeader,
  args: { label: 'Yesterday' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DayHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
