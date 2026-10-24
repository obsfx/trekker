import type { Meta, StoryObj } from '@storybook/react-vite';

import { MutedHint } from '@/ui/primitives/muted-hint.tsx';
import { PopoverPanel } from '@/ui/primitives/popover-panel.tsx';

const meta = {
  title: 'Primitives/PopoverPanel',
  component: PopoverPanel,
  args: { className: 'left-0 w-72', children: <MutedHint>No matches</MutedHint> },
  decorators: [
    (Story) => {
      return (
        <div className="relative h-24 w-72">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof PopoverPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
