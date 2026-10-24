import { useShallow } from 'zustand/react/shallow';

import { ItemKinds } from '@/ui/lib/item-kinds.ts';
import type { SortField } from '@/ui/lib/item-queries.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { Priorities } from '@/ui/lib/priorities.ts';
import { useListViewStore } from '@/ui/store/list-view-store.ts';

const LIST_SORT_FIELDS: readonly SortField[] = ['updated', 'created', 'priority', 'title'];

export const useListToolbar = () => {
  const view = useListViewStore(
    useShallow((state) => {
      return state;
    })
  );
  return {
    ...view,
    sortFields: LIST_SORT_FIELDS,
    typeOptions: ItemKinds.all.map((kind) => {
      return { value: kind, label: ItemKinds.label(kind) };
    }),
    statusOptions: ItemStatuses.all.map((status) => {
      return { value: status, label: ItemStatuses.label(status) };
    }),
    priorityOptions: Priorities.all.map((priority) => {
      return { value: priority, label: Priorities.describe(priority) };
    }),
  };
};
