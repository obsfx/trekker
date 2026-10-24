import { useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { useBoardView } from '@/ui/hooks/use-board-view.ts';
import type { BoardKind } from '@/ui/lib/board.ts';
import { ItemQueries, type SortField } from '@/ui/lib/item-queries.ts';
import type { LabeledOption } from '@/ui/lib/labeled-option.ts';
import { SortToggles } from '@/ui/lib/sort-toggles.ts';
import { useBoardViewStore } from '@/ui/store/board-view-store.ts';

const KIND_OPTIONS: LabeledOption<BoardKind>[] = [
  { value: 'all', label: 'All items' },
  { value: 'epic', label: 'Epics' },
  { value: 'task', label: 'Tasks' },
];

export const useBoardToolbar = () => {
  const { board } = useServices();
  const view = useBoardView();
  const setKind = useBoardViewStore((state) => {
    return state.setKind;
  });
  const setEpicId = useBoardViewStore((state) => {
    return state.setEpicId;
  });
  const setSort = useBoardViewStore((state) => {
    return state.setSort;
  });
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  return {
    view,
    kindOptions: KIND_OPTIONS,
    sortFields: ItemQueries.sortFields,
    sortLabel: ItemQueries.sortLabel(view.sort.field),
    kindLabel:
      KIND_OPTIONS.find((option) => {
        return option.value === view.kind;
      })?.label ?? 'All items',
    setKind,
    setEpicId,
    setSortField: (field: SortField) => {
      setSort(SortToggles.withField(field));
    },
    confirmingArchive,
    setConfirmingArchive,
    archive: () => {
      void board.archiveCompleted();
    },
  };
};
