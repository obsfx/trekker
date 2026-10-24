import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DateFilter } from '@/ui/lib/date-ranges.ts';
import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import { ItemQueries, type ItemSort } from '@/ui/lib/item-queries.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { PersistedState } from '@/ui/lib/persisted-state.ts';
import { PersistedViews } from '@/ui/lib/persisted-views.ts';
import type { Priority } from '@/ui/lib/priorities.ts';
import { Selections } from '@/ui/lib/selections.ts';

interface ListFilters {
  types: ItemKind[];
  statuses: ItemStatus[];
  priorities: Priority[];
  epicId: string | null;
  dateFilter: DateFilter | null;
  sort: ItemSort;
}

interface ListViewState extends ListFilters {
  toggleType: (kind: ItemKind) => void;
  toggleStatus: (status: ItemStatus) => void;
  togglePriority: (priority: Priority) => void;
  clearTypes: () => void;
  clearStatuses: () => void;
  clearPriorities: () => void;
  setEpicId: (epicId: string | null) => void;
  setDateFilter: (dateFilter: DateFilter | null) => void;
  setSort: (sort: ItemSort) => void;
}

export const useListViewStore = create<ListViewState>()(
  persist(
    (set, get) => {
      return {
        types: [],
        statuses: [],
        priorities: [],
        epicId: null,
        dateFilter: null,
        sort: ItemQueries.recentSort,
        toggleType: (kind) => {
          set({ types: Selections.toggle(get().types, kind) });
        },
        toggleStatus: (status) => {
          set({ statuses: Selections.toggle(get().statuses, status) });
        },
        togglePriority: (priority) => {
          set({ priorities: Selections.toggle(get().priorities, priority) });
        },
        clearTypes: () => {
          set({ types: [] });
        },
        clearStatuses: () => {
          set({ statuses: [] });
        },
        clearPriorities: () => {
          set({ priorities: [] });
        },
        setEpicId: (epicId) => {
          set({ epicId });
        },
        setDateFilter: (dateFilter) => {
          set({ dateFilter });
        },
        setSort: (sort) => {
          set({ sort });
        },
      };
    },
    {
      name: 'trekker.list',
      storage: createJSONStorage(() => {
        return localStorage;
      }),
      partialize: ({ types, statuses, priorities, epicId, dateFilter, sort }) => {
        return { types, statuses, priorities, epicId, dateFilter, sort };
      },
      merge: PersistedState.merge<ListViewState>(PersistedViews.listView),
    }
  )
);
