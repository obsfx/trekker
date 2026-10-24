import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import { type ItemStatus, ItemStatuses } from '@/ui/lib/item-statuses.ts';

export abstract class KindStatuses {
  private static readonly epicStatuses: readonly ItemStatus[] = [
    'todo',
    'in_progress',
    'completed',
    'archived',
  ];

  static of(kind: ItemKind): readonly ItemStatus[] {
    if (kind === 'epic') {
      return KindStatuses.epicStatuses;
    }
    return ItemStatuses.all;
  }
}
