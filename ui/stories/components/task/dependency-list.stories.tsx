import type { Meta, StoryObj } from '@storybook/react-vite';
import { TbLink } from 'react-icons/tb';
import { fn } from 'storybook/test';

import { DependencyList } from '@/ui/components/task/dependency-list.tsx';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

const meta = {
  title: 'Components/Task/DependencyList',
  component: DependencyList,
  args: {
    icon: <TbLink className="size-3.5" />,
    label: 'Depends on',
    count: '1 open',
    refs: [
      { id: 'TREK-131', title: 'trekker serve command and REST API', status: 'in_progress' },
      { id: 'TREK-105', title: 'Search crashes on unbalanced quotes', status: 'completed' },
    ],
    excludeIds: ['TREK-132'],
    emptyText: 'Depends on nothing',
    addLabel: 'Link',
    onAdd: fn(),
    onRemove: fn(),
  },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <div className="w-[32rem]">
            <Story />
          </div>
        </StoryServices>
      );
    },
  ],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DependencyList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithLinks: Story = {};

export const Empty: Story = { args: { refs: [], count: undefined } };
