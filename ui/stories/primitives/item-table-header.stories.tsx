import type { Meta, StoryObj } from '@storybook/react-vite';

import { ITEM_TABLE_COLUMNS } from '@/ui/primitives/item-table-columns.ts';
import { ItemTableHeader } from '@/ui/primitives/item-table-header.tsx';
import { ItemTableHeaderCell } from '@/ui/primitives/item-table-header-cell.tsx';

const meta = {
  title: 'Primitives/ItemTableHeader',
  component: ItemTableHeader,
  args: {
    children: (
      <>
        <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.priority} label="P" />
        <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.status} label="" />
        <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.id} label="ID" />
        <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.title} label="Title" />
        <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.updated} label="Updated" />
      </>
    ),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ItemTableHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
