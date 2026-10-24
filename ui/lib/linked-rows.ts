import { AppRoutes } from '@/ui/lib/app-routes.ts';
import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import type { ItemRef } from '@/ui/lib/item-shapes.ts';
import { ItemStatuses } from '@/ui/lib/item-statuses.ts';

interface LinkedFields {
  href: string;
  done: boolean;
}

export abstract class LinkedRows {
  static of<T extends ItemRef>(refs: readonly T[], kind: ItemKind): (T & LinkedFields)[] {
    return refs.map((ref) => {
      return {
        ...ref,
        href: AppRoutes.item({ kind, id: ref.id }),
        done: ItemStatuses.isDone(ref.status),
      };
    });
  }
}
