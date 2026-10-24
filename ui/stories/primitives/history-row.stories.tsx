import type { Meta, StoryObj } from '@storybook/react-vite';

import { HistoryChange } from '@/ui/primitives/history-change.tsx';
import { HistoryRow } from '@/ui/primitives/history-row.tsx';

const meta = {
  title: 'Primitives/HistoryRow',
  component: HistoryRow,
  args: {
    glyph: 'update',
    verb: 'updated task',
    entity: 'TREK-132',
    title: 'Event feed and SSE with replay after reconnect',
    snippet: null,
    time: '14:32',
    timeTitle: 'Oct 24, 2026 14:32',
    children: (
      <>
        <HistoryChange field="status" from="Todo" to="In progress" />
        <HistoryChange field="priority" from="P2" to="P1" />
      </>
    ),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HistoryRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Update: Story = {};

export const Comment: Story = {
  args: {
    glyph: 'comment',
    verb: 'commented on',
    children: null,
    snippet: 'Replay works after sleep; the ready event carries lastEventId so the UI resumes.',
  },
};

export const LongTitle: Story = {
  args: {
    title:
      'A very long task title that keeps going to show how the row truncates when the window is narrow and the changes still need room',
  },
};
