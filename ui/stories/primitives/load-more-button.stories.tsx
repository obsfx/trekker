import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LoadMoreButton } from '@/ui/primitives/load-more-button.tsx';

const meta = {
  title: 'Primitives/LoadMoreButton',
  component: LoadMoreButton,
  args: { loading: false, shown: 50, total: 4182, next: 50, onClick: fn() },
  decorators: [
    (Story) => {
      return (
        <div className="w-72">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LoadMoreButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = { args: { loading: true } };

export const LastPage: Story = { args: { shown: 4150, total: 4182, next: 32 } };
