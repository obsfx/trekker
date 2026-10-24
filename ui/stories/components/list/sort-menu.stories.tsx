import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { SortMenu } from '@/ui/components/list/sort-menu.tsx';
import { ItemQueries, type ItemSort } from '@/ui/lib/item-queries.ts';

interface SortMenuDemoProps {
  initial: ItemSort;
}

function SortMenuDemo({ initial }: SortMenuDemoProps) {
  const [sort, setSort] = useState(initial);
  return (
    <SortMenu sort={sort} fields={['updated', 'created', 'priority', 'title']} onChange={setSort} />
  );
}

const meta = {
  title: 'Components/List/SortMenu',
  component: SortMenuDemo,
  args: { initial: ItemQueries.recentSort },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SortMenuDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PriorityAscending: Story = {
  args: { initial: { field: 'priority', direction: 'asc' } },
};
