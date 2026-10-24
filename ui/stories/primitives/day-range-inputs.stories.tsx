import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DayRangeInputs } from '@/ui/primitives/day-range-inputs.tsx';

const meta = {
  title: 'Primitives/DayRangeInputs',
  component: DayRangeInputs,
  args: { from: '2026-10-01', to: '2026-10-14', onChange: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DayRangeInputs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Range: Story = {};

export const Empty: Story = { args: { from: '', to: '' } };
