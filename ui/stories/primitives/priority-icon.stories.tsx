import type { Meta, StoryObj } from '@storybook/react-vite';

import { Priorities } from '@/ui/lib/priorities.ts';
import { PriorityIcon } from '@/ui/primitives/priority-icon.tsx';

const meta = {
  title: 'Primitives/PriorityIcon',
  component: PriorityIcon,
  args: { priority: 1 },
  argTypes: { priority: { control: 'select', options: Priorities.all } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PriorityIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllPriorities: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-1.5">
        {Priorities.all.map((priority) => {
          return (
            <span key={priority} className="flex items-center gap-1.5 text-xs text-fg-2">
              <PriorityIcon priority={priority} />
              {Priorities.describe(priority)}
            </span>
          );
        })}
      </div>
    );
  },
};
