import { useShallow } from 'zustand/react/shallow';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useNow } from '@/ui/hooks/use-now.ts';
import { DateRanges } from '@/ui/lib/date-ranges.ts';
import { ItemQueries, type ItemQuery, type SortField } from '@/ui/lib/item-queries.ts';
import { SortToggles } from '@/ui/lib/sort-toggles.ts';
import { useListViewStore } from '@/ui/store/list-view-store.ts';

export const useListPage = () => {
  const { lists } = useServices();
  const view = useListViewStore(
    useShallow((state) => {
      return {
        types: state.types,
        statuses: state.statuses,
        priorities: state.priorities,
        epicId: state.epicId,
        dateFilter: state.dateFilter,
        sort: state.sort,
        setSort: state.setSort,
      };
    })
  );
  const now = useNow();
  const query: ItemQuery = {
    ...ItemQueries.empty(view.sort),
    types: view.types,
    statuses: view.statuses,
    priorities: view.priorities,
    epicId: view.epicId,
    dates: DateRanges.resolve(view.dateFilter, now),
  };
  const filtered =
    view.types.length > 0 ||
    view.statuses.length > 0 ||
    view.priorities.length > 0 ||
    view.epicId !== null ||
    view.dateFilter !== null;
  return {
    list: lists.get(query),
    sort: view.sort,
    emptyLabel: filtered ? 'Nothing matches these filters.' : 'No tasks or epics yet.',
    toggleSort: (field: SortField) => {
      view.setSort(SortToggles.next(view.sort, field));
    },
  };
};
