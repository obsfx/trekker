import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ITEM_TABLE_COLUMNS } from '@/ui/primitives/item-table-columns.ts';
import { ItemTableHeaderCell } from '@/ui/primitives/item-table-header-cell.tsx';

const meta = {
  title: 'Primitives/ItemTableHeaderCell',
  component: ItemTableHeaderCell,
  args: { className: ITEM_TABLE_COLUMNS.title, label: 'Title', onSort: fn() },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ItemTableHeaderCell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sortable: Story = {};

export const Ascending: Story = { args: { sorted: 'asc' } };

export const Descending: Story = { args: { sorted: 'desc' } };

export const Static: Story = { args: { label: 'Tags', onSort: undefined } };
