import { useShallow } from 'zustand/react/shallow';

import type { BoardView } from '@/ui/lib/board.ts';
import { useBoardViewStore } from '@/ui/store/board-view-store.ts';

export const useBoardView = (): BoardView => {
  return useBoardViewStore(
    useShallow((state) => {
      return { kind: state.kind, epicId: state.epicId, sort: state.sort };
    })
  );
};
