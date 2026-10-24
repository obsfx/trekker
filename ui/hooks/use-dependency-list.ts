import type { ItemRef } from '@/ui/lib/item-shapes.ts';
import { LinkedRows } from '@/ui/lib/linked-rows.ts';

export const useDependencyList = (refs: readonly ItemRef[]) => {
  return { rows: LinkedRows.of(refs, 'task'), empty: refs.length === 0 };
};
