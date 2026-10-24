import * as v from 'valibot';

const ITEM_STATUSES = ['todo', 'in_progress', 'completed', 'wont_fix', 'archived'] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export abstract class ItemStatuses {
  static readonly all: readonly ItemStatus[] = ITEM_STATUSES;
  static readonly board: readonly ItemStatus[] = ['todo', 'in_progress', 'completed', 'wont_fix'];
  static readonly schema = v.picklist(ITEM_STATUSES);

  private static readonly labels: Record<ItemStatus, string> = {
    todo: 'Todo',
    in_progress: 'In progress',
    completed: 'Completed',
    wont_fix: "Won't fix",
    archived: 'Archived',
  };

  static label(status: ItemStatus) {
    return ItemStatuses.labels[status];
  }

  static isDone(status: ItemStatus) {
    return status === 'completed' || status === 'wont_fix' || status === 'archived';
  }
}
