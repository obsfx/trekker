import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { EpicHeader } from '@/ui/components/epic/epic-header.tsx';
import { KindStatuses } from '@/ui/lib/kind-statuses.ts';
import { StatusCounts } from '@/ui/lib/status-counts.ts';
import {
  SAMPLE_EPIC_SUMMARY,
  SAMPLE_STATUS_COUNTS,
} from '@/ui/stories/fixtures/sample-summaries.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Epic/EpicHeader',
  component: EpicHeader,
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
  args: {
    epic: {
      ...SAMPLE_EPIC_SUMMARY,
      description:
        'Rewrite the dashboard inside the trekker CLI: single embedded HTML, REST and SSE, Storybook-first components.',
      statusCounts: SAMPLE_STATUS_COUNTS,
    },
    statuses: KindStatuses.of('epic'),
    summary: '7 of 18 tasks done',
    segments: StatusCounts.segments(SAMPLE_STATUS_COUNTS),
    createdLabel: 'Oct 23, 2026 08:40',
    updatedLabel: '5m',
    updatedTitle: 'Oct 24, 2026 11:40',
    onUpdate: fn(),
    onAddTask: fn(),
    onDelete: fn(),
    actionsRef: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof EpicHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: {
    epic: { ...SAMPLE_EPIC_SUMMARY, description: null, statusCounts: SAMPLE_STATUS_COUNTS },
  },
};
