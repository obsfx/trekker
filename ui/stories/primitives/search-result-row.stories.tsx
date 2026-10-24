import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchResultRow } from '@/ui/primitives/search-result-row.tsx';

const meta = {
  title: 'Primitives/SearchResultRow',
  component: SearchResultRow,
  args: {
    itemId: 'TREK-132',
    title: 'Event feed and SSE with replay after reconnect',
    status: 'in_progress',
    highlighted: false,
  },
  decorators: [
    (Story) => {
      return (
        <div className="w-80">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SearchResultRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Highlighted: Story = { args: { highlighted: true } };
