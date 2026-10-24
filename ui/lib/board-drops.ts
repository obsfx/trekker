import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge';

import { Board, type BoardDrop, type BoardView } from '@/ui/lib/board.ts';
import { BoardDragData, type CardDragData } from '@/ui/lib/board-drag-data.ts';

interface DropTarget {
  data: Record<string | symbol, unknown>;
}

export abstract class BoardDrops {
  static plan(
    board: Board,
    view: BoardView,
    source: Record<string | symbol, unknown>,
    targets: readonly DropTarget[]
  ): BoardDrop | null {
    if (!BoardDragData.isCard(source)) {
      return null;
    }
    const column = targets.find((target) => {
      return BoardDragData.columnStatus(target.data) !== null;
    });
    let to = null;
    if (column) {
      to = BoardDragData.columnStatus(column.data);
    }
    if (!to || !Board.canDrop(source.item, to)) {
      return null;
    }
    const drop: BoardDrop = { item: source.item, to, anchorId: null, placement: 'before' };
    if (!Board.isManual(view)) {
      return drop;
    }
    const card = targets.find((target) => {
      return BoardDragData.isCardTarget(target.data);
    });
    if (card && BoardDragData.isCardTarget(card.data)) {
      drop.anchorId = card.data.itemId;
      if (extractClosestEdge(card.data) === 'bottom') {
        drop.placement = 'after';
      }
      return drop;
    }
    if (source.item.status === to) {
      return null;
    }
    return BoardDrops.atColumnEnd(board, view, source, drop);
  }

  private static atColumnEnd(
    board: Board,
    view: BoardView,
    source: CardDragData,
    drop: BoardDrop
  ): BoardDrop {
    const last = board.column(view, drop.to).state.items.findLast((item) => {
      return item.id !== source.itemId;
    });
    if (last) {
      return { ...drop, anchorId: last.id, placement: 'after' };
    }
    return drop;
  }
}
