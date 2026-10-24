import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressMeter } from '@/ui/primitives/progress-meter.tsx';

const meta = {
  title: 'Primitives/ProgressMeter',
  component: ProgressMeter,
  args: { percent: (9 / 14) * 100, label: '9/14' },
  decorators: [
    (Story) => {
      return (
        <div className="flex w-64">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProgressMeter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { percent: 0, label: '0/0' } };
