import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { ItemTable } from '@/ui/components/items/item-table.tsx';
import { useServices } from '@/ui/context/services/use-services.ts';
import { ItemQueries, type ItemSort } from '@/ui/lib/item-queries.ts';
import { SortToggles } from '@/ui/lib/sort-toggles.ts';
import { StoryServices } from '@/ui/stories/support/story-services.tsx';

interface ItemTableDemoProps {
  epicId: string | null;
}

function ItemTableDemo({ epicId }: ItemTableDemoProps) {
  const { lists } = useServices();
  const [sort, setSort] = useState<ItemSort>(ItemQueries.recentSort);
  const list = lists.get({ ...ItemQueries.empty(sort), epicId });
  return (
    <div className="flex h-screen flex-col">
      <ItemTable
        list={list}
        sort={sort}
        showEpic={epicId === null}
        emptyLabel="Nothing matches these filters."
        onSort={(field) => {
          setSort(SortToggles.next(sort, field));
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Components/Items/ItemTable',
  component: ItemTableDemo,
  args: { epicId: null },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ItemTableDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      return (
        <StoryServices latencyMs={60_000}>
          <Story />
        </StoryServices>
      );
    },
  ],
};

export const Empty: Story = {
  args: { epicId: 'EPIC-999' },
  decorators: [
    (Story) => {
      return (
        <StoryServices>
          <Story />
        </StoryServices>
      );
    },
  ],
};
