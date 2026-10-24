import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryToolbar } from '@/ui/components/history/history-toolbar.tsx';

const meta = {
  title: 'Components/History/HistoryToolbar',
  component: HistoryToolbar,
  args: { totalLabel: '48,213 events' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HistoryToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
