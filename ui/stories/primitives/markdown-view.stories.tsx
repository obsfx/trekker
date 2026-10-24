import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkdownView } from '@/ui/primitives/markdown-view.tsx';

const meta = {
  title: 'Primitives/MarkdownView',
  component: MarkdownView,
  args: {
    source: [
      'The old dashboard rescanned every task every 2s.',
      '',
      '## Plan',
      '',
      '- One `EventFeed` per server process',
      '- Replay with `?after=<id>`',
      '',
      '```ts',
      'const rows = db.query(sql).all(lastId, limit)',
      '```',
      '',
      '| Metric | Before | After |',
      '| --- | --- | --- |',
      '| Idle tick | 180ms | 0.02ms |',
    ].join('\n'),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MarkdownView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
