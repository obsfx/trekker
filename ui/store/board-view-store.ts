import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BoardKind, BoardView } from '@/ui/lib/board.ts';
import { ItemQueries, type ItemSort } from '@/ui/lib/item-queries.ts';
import { PersistedState } from '@/ui/lib/persisted-state.ts';
import { PersistedViews } from '@/ui/lib/persisted-views.ts';

interface BoardViewState extends BoardView {
  setKind: (kind: BoardKind) => void;
  setEpicId: (epicId: string | null) => void;
  setSort: (sort: ItemSort) => void;
}

export const useBoardViewStore = create<BoardViewState>()(
  persist(
    (set) => {
      return {
        kind: 'all',
        epicId: null,
        sort: ItemQueries.manualSort,
        setKind: (kind) => {
          set({ kind });
        },
        setEpicId: (epicId) => {
          set({ epicId });
        },
        setSort: (sort) => {
          set({ sort });
        },
      };
    },
    {
      name: 'trekker.board',
      storage: createJSONStorage(() => {
        return localStorage;
      }),
      partialize: ({ kind, epicId, sort }) => {
        return { kind, epicId, sort };
      },
      merge: PersistedState.merge<BoardViewState>(PersistedViews.boardView),
    }
  )
);
