import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';

type DragRecord = Record<string | symbol, unknown>;

export interface CardDragData extends DragRecord {
  type: 'board-card';
  itemId: string;
  item: ItemSummary;
}

export interface CardTargetData extends DragRecord {
  type: 'board-card-target';
  itemId: string;
}

export interface ColumnTargetData extends DragRecord {
  type: 'board-column';
  status: ItemStatus;
}

export abstract class BoardDragData {
  static card(item: ItemSummary): CardDragData {
    return { type: 'board-card', itemId: item.id, item };
  }

  static cardTarget(item: ItemSummary): CardTargetData {
    return { type: 'board-card-target', itemId: item.id };
  }

  static column(status: ItemStatus): ColumnTargetData {
    return { type: 'board-column', status };
  }

  static isCard(data: DragRecord): data is CardDragData {
    return (
      data.type === 'board-card' && typeof data.itemId === 'string' && typeof data.item === 'object'
    );
  }

  static isCardTarget(data: DragRecord): data is CardTargetData {
    return data.type === 'board-card-target' && typeof data.itemId === 'string';
  }

  static columnStatus(data: DragRecord): ItemStatus | null {
    if (data.type !== 'board-column') {
      return null;
    }
    return (
      ItemStatuses.all.find((status) => {
        return status === data.status;
      }) ?? null
    );
  }
}
