import { ItemTable } from '@/ui/components/items/item-table.tsx';
import { ListToolbar } from '@/ui/components/list/list-toolbar.tsx';
import { useListPage } from '@/ui/hooks/use-list-page.ts';
import { PageToolbar } from '@/ui/primitives/page-toolbar.tsx';

export function ListPage() {
  const page = useListPage();
  return (
    <>
      <PageToolbar>
        <ListToolbar />
      </PageToolbar>
      <ItemTable
        list={page.list}
        sort={page.sort}
        showEpic={true}
        emptyLabel={page.emptyLabel}
        onSort={page.toggleSort}
      />
    </>
  );
}
