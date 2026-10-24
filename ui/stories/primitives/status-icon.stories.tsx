import type { Meta, StoryObj } from '@storybook/react-vite';

import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { StatusIcon } from '@/ui/primitives/status-icon.tsx';

const meta = {
  title: 'Primitives/StatusIcon',
  component: StatusIcon,
  args: { status: 'in_progress' },
  argTypes: { status: { control: 'select', options: ItemStatuses.all } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-1.5">
        {ItemStatuses.all.map((status) => {
          return (
            <span key={status} className="flex items-center gap-1.5 text-xs text-fg-2">
              <StatusIcon status={status} />
              {ItemStatuses.label(status)}
            </span>
          );
        })}
      </div>
    );
  },
};
