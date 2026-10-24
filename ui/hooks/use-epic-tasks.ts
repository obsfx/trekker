import { useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import {
  ItemQueries,
  type ItemQuery,
  type ItemSort,
  type SortField,
} from '@/ui/lib/item-queries.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';
import { SortToggles } from '@/ui/lib/sort-toggles.ts';
import { StatusCounts } from '@/ui/lib/status-counts.ts';

type EpicTaskTab = 'all' | ItemStatus;

export const useEpicTasks = (epicId: string, counts: Record<ItemStatus, number>) => {
  const { lists } = useServices();
  const [tab, setTab] = useState<EpicTaskTab>('all');
  const [sort, setSort] = useState<ItemSort>(ItemQueries.recentSort);
  const query: ItemQuery = {
    ...ItemQueries.empty(sort),
    types: ['task'],
    epicId,
    statuses: tab === 'all' ? [] : [tab],
  };
  const tabs = [
    { key: 'all' as const, label: 'All', count: StatusCounts.total(counts) },
    ...ItemStatuses.board.map((status) => {
      return { key: status, label: ItemStatuses.label(status), count: counts[status] };
    }),
  ];
  return {
    tab,
    tabs,
    setTab,
    sort,
    list: lists.get(query),
    emptyLabel: tab === 'all' ? 'This epic has no tasks yet.' : 'No tasks with this status.',
    toggleSort: (field: SortField) => {
      setSort(SortToggles.next(sort, field));
    },
  };
};
