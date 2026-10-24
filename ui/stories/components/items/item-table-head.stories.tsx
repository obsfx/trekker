import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ItemTableHead } from '@/ui/components/items/item-table-head.tsx';
import { ItemQueries } from '@/ui/lib/item-queries.ts';

const meta = {
  title: 'Components/Items/ItemTableHead',
  component: ItemTableHead,
  args: { sort: ItemQueries.recentSort, showEpic: true, onSort: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ItemTableHead>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SortedByUpdated: Story = {};

export const SortedByTitle: Story = { args: { sort: { field: 'title', direction: 'asc' } } };

export const WithoutEpic: Story = { args: { showEpic: false } };
