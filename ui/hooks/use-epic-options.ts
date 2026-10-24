import { useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { TextQueries } from '@/ui/lib/text-queries.ts';

const EPIC_QUERY = {
  ...ItemQueries.empty(ItemQueries.recentSort),
  types: ['epic' as const],
  statuses: ['todo' as const, 'in_progress' as const, 'completed' as const],
};

export const useEpicOptions = () => {
  const { lists } = useServices();
  const page = usePagedList(lists.get(EPIC_QUERY));
  const [filter, setFilter] = useState('');
  const options = page.items.filter((epic) => {
    return TextQueries.matches(filter, `${epic.id} ${epic.title}`);
  });
  return {
    filter,
    setFilter,
    options,
    loading: page.status === 'loading',
    hasMore: page.nextCursor !== null,
    loadMore: page.loadMore,
  };
};
