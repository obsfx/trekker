import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DateFilter } from '@/ui/lib/date-ranges.ts';
import type { HistoryAction, HistoryEntity } from '@/ui/lib/history-shapes.ts';
import { PersistedState } from '@/ui/lib/persisted-state.ts';
import { PersistedViews } from '@/ui/lib/persisted-views.ts';
import { Selections } from '@/ui/lib/selections.ts';

interface HistoryViewState {
  types: HistoryEntity[];
  actions: HistoryAction[];
  dateFilter: DateFilter | null;
  setDateFilter: (dateFilter: DateFilter | null) => void;
  toggleType: (type: HistoryEntity) => void;
  toggleAction: (action: HistoryAction) => void;
  clearTypes: () => void;
  clearActions: () => void;
}

export const useHistoryViewStore = create<HistoryViewState>()(
  persist(
    (set, get) => {
      return {
        types: [],
        actions: [],
        dateFilter: null,
        setDateFilter: (dateFilter) => {
          set({ dateFilter });
        },
        toggleType: (type) => {
          set({ types: Selections.toggle(get().types, type) });
        },
        toggleAction: (action) => {
          set({ actions: Selections.toggle(get().actions, action) });
        },
        clearTypes: () => {
          set({ types: [] });
        },
        clearActions: () => {
          set({ actions: [] });
        },
      };
    },
    {
      name: 'trekker.history',
      storage: createJSONStorage(() => {
        return localStorage;
      }),
      partialize: ({ types, actions, dateFilter }) => {
        return { types, actions, dateFilter };
      },
      merge: PersistedState.merge<HistoryViewState>(PersistedViews.historyView),
    }
  )
);
