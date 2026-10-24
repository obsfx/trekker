import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useEffect, useEffectEvent } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import type { BoardView } from '@/ui/lib/board.ts';
import { BoardDragData } from '@/ui/lib/board-drag-data.ts';
import { BoardDrops } from '@/ui/lib/board-drops.ts';

export const useBoardDropMonitor = (view: BoardView) => {
  const { board } = useServices();
  const currentView = useEffectEvent(() => {
    return view;
  });

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) => {
        return BoardDragData.isCard(source.data);
      },
      onDrop: ({ source, location }) => {
        const activeView = currentView();
        const drop = BoardDrops.plan(board, activeView, source.data, location.current.dropTargets);
        if (drop) {
          void board.move(activeView, drop);
        }
      },
    });
  }, [board]);
};
