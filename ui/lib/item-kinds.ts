import * as v from 'valibot';

const ITEM_KINDS = ['epic', 'task', 'subtask'] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];

export abstract class ItemKinds {
  static readonly all: readonly ItemKind[] = ITEM_KINDS;
  static readonly schema = v.picklist(ITEM_KINDS);

  private static readonly labels: Record<ItemKind, string> = {
    epic: 'Epic',
    task: 'Task',
    subtask: 'Subtask',
  };

  static label(kind: ItemKind) {
    return ItemKinds.labels[kind];
  }
}
