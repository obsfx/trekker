import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbArchive, TbFilter, TbSortDescending } from 'react-icons/tb';

import { Button } from '@/ui/primitives/button.tsx';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';
import { SegmentedControl } from '@/ui/primitives/segmented-control.tsx';
import { SegmentedOption } from '@/ui/primitives/segmented-option.tsx';

const meta = {
  title: 'Primitives/PageToolbar',
  component: PageToolbar,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <SegmentedControl label="Show">
          <SegmentedOption active={true}>All</SegmentedOption>
          <SegmentedOption active={false}>Epics</SegmentedOption>
          <SegmentedOption active={false}>Tasks</SegmentedOption>
        </SegmentedControl>
        <Button variant="text">
          <TbFilter className="size-3.5" />
          Epic
        </Button>
        <Button variant="text">
          <TbSortDescending className="size-3.5" />
          Updated
        </Button>
        <Button variant="text" className="ml-auto">
          <TbArchive className="size-3.5" />
          Archive completed
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof PageToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
