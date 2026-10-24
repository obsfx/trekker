import { useItemTableHead } from '@/ui/hooks/use-item-table-head.ts';
import type { ItemSort, SortField } from '@/ui/lib/item-queries.ts';
import { ITEM_TABLE_COLUMNS } from '@/ui/primitives/item-table-columns.ts';
import { ItemTableHeader } from '@/ui/primitives/item-table-header.tsx';
import { ItemTableHeaderCell } from '@/ui/primitives/item-table-header-cell.tsx';

interface ItemTableHeadProps {
  sort: ItemSort;
  showEpic: boolean;
  onSort: (field: SortField) => void;
}

export function ItemTableHead({ sort, showEpic, onSort }: ItemTableHeadProps) {
  const { directions } = useItemTableHead(sort);
  return (
    <ItemTableHeader>
      <ItemTableHeaderCell
        className={ITEM_TABLE_COLUMNS.priority}
        label="P"
        title="Sort by priority"
        sorted={directions.priority}
        onSort={() => {
          onSort('priority');
        }}
      />
      <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.status} label="" title="Status" />
      <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.id} label="ID" />
      <ItemTableHeaderCell
        className={ITEM_TABLE_COLUMNS.title}
        label="Title"
        title="Sort by title"
        sorted={directions.title}
        onSort={() => {
          onSort('title');
        }}
      />
      <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.tags} label="Tags" />
      {showEpic && <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.epic} label="Epic" />}
      <ItemTableHeaderCell className={ITEM_TABLE_COLUMNS.activity} label="Activity" />
      <ItemTableHeaderCell
        className={ITEM_TABLE_COLUMNS.updated}
        label="Updated"
        title="Sort by last update"
        sorted={directions.updated}
        onSort={() => {
          onSort('updated');
        }}
      />
    </ItemTableHeader>
  );
}
