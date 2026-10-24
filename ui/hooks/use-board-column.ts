import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';

import { useServices } from '@/ui/context/services/use-services.ts';
import { usePagedList } from '@/ui/hooks/use-paged-list.ts';
import { Board, type BoardView } from '@/ui/lib/board.ts';
import { BoardDragData } from '@/ui/lib/board-drag-data.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import { useCreateDialogStore } from '@/ui/store/create-dialog-store.ts';

const CARD_ESTIMATE_PX = 78;
const LOAD_MORE_KEY = 'load-more';

interface BoardColumnRow {
  key: string;
  index: number;
  start: number;
  item: ItemSummary | null;
}

export const useBoardColumn = (view: BoardView, status: ItemStatus) => {
  'use no memo';
  const { board } = useServices();
  const page = usePagedList(board.column(view, status));
  const showCreate = useCreateDialogStore((state) => {
    return state.show;
  });
  const columnRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [incoming, setIncoming] = useState(false);
  const hasMore = page.nextCursor !== null;

  const virtualizer = useVirtualizer({
    count: page.items.length + (hasMore ? 1 : 0),
    getScrollElement: () => {
      return scrollRef.current;
    },
    estimateSize: () => {
      return CARD_ESTIMATE_PX;
    },
    getItemKey: (index) => {
      return page.items[index]?.id ?? LOAD_MORE_KEY;
    },
    overscan: 6,
  });

  useEffect(() => {
    const column = columnRef.current;
    const scroller = scrollRef.current;
    if (!column || !scroller) {
      return;
    }
    return combine(
      dropTargetForElements({
        element: column,
        getData: () => {
          return BoardDragData.column(status);
        },
        canDrop: ({ source }) => {
          return BoardDragData.isCard(source.data) && Board.canDrop(source.data.item, status);
        },
        onDragEnter: ({ source }) => {
          setIncoming(BoardDragData.isCard(source.data) && source.data.item.status !== status);
        },
        onDragLeave: () => {
          setIncoming(false);
        },
        onDrop: () => {
          setIncoming(false);
        },
      }),
      autoScrollForElements({ element: scroller })
    );
  }, [status]);

  const rows = virtualizer.getVirtualItems().map((row): BoardColumnRow => {
    return {
      key: String(row.key),
      index: row.index,
      start: row.start,
      item: page.items[row.index] ?? null,
    };
  });

  return {
    page,
    columnRef,
    scrollRef,
    rows,
    totalSize: virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
    incoming,
    reorderable: Board.isManual(view),
    add: () => {
      showCreate({ kind: view.kind === 'epic' ? 'epic' : 'task', status, epicId: view.epicId });
    },
  };
};
