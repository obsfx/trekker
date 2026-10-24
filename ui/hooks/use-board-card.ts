import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/attach-closest-edge';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { useEffect, useRef, useState } from 'react';

import { AppRoutes } from '@/ui/lib/app-routes.ts';
import { Board } from '@/ui/lib/board.ts';
import { BoardDragData } from '@/ui/lib/board-drag-data.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import { RelativeTime } from '@/ui/lib/relative-time.ts';
import { Tallies } from '@/ui/lib/tallies.ts';

type DropEdge = 'top' | 'bottom';

export const useBoardCard = (item: ItemSummary, reorderable: boolean, now: number) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [dragging, setDragging] = useState(false);
  const [edge, setEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const drag = draggable({
      element,
      getInitialData: () => {
        return BoardDragData.card(item);
      },
      onDragStart: () => {
        setDragging(true);
      },
      onDrop: () => {
        setDragging(false);
      },
    });
    if (!reorderable) {
      return drag;
    }
    return combine(
      drag,
      dropTargetForElements({
        element,
        getData: ({ input }) => {
          return attachClosestEdge(BoardDragData.cardTarget(item), {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          });
        },
        canDrop: ({ source }) => {
          return (
            BoardDragData.isCard(source.data) &&
            source.data.itemId !== item.id &&
            Board.canDrop(source.data.item, item.status)
          );
        },
        onDrag: ({ self }) => {
          setEdge(extractClosestEdge(self.data));
        },
        onDragLeave: () => {
          setEdge(null);
        },
        onDrop: () => {
          setEdge(null);
        },
      })
    );
  }, [item, reorderable]);

  let dropEdge: DropEdge | null = null;
  if (edge === 'top' || edge === 'bottom') {
    dropEdge = edge;
  }
  return {
    ref,
    dragging,
    dropEdge,
    href: AppRoutes.item(item),
    updatedLabel: RelativeTime.short(item.updatedAt, now),
    progress: Tallies.view(item.progress),
  };
};
