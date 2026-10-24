import type { Meta, StoryObj } from '@storybook/react-vite';

import { ItemTableRow } from '@/ui/primitives/item-table-row.tsx';
import {
  SAMPLE_EPIC_SUMMARY,
  SAMPLE_TASK_SUMMARY,
} from '@/ui/stories/fixtures/sample-summaries.ts';
import { StoryRouter } from '@/ui/stories/support/story-router.tsx';

const meta = {
  title: 'Primitives/ItemTableRow',
  component: ItemTableRow,
  args: {
    item: SAMPLE_TASK_SUMMARY,
    to: '/tasks/TREK-12',
    updatedLabel: '20m',
    updatedTitle: 'Updated Oct 24, 2026 11:40',
    showEpic: true,
  },
  decorators: [
    (Story) => {
      return (
        <StoryRouter>
          <Story />
        </StoryRouter>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ItemTableRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Task: Story = {};

export const Epic: Story = { args: { item: SAMPLE_EPIC_SUMMARY } };

export const WithoutEpicColumn: Story = { args: { showEpic: false } };

export const LongTitle: Story = {
  args: {
    item: {
      ...SAMPLE_TASK_SUMMARY,
      title:
        'Investigate why the board keeps every card mounted after scrolling through four thousand todo items on a slow laptop',
      tags: ['performance', 'ui', 'board', 'regression'],
    },
  },
};
