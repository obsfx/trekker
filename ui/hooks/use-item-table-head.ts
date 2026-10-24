import type { ItemSort } from '@/ui/lib/item-queries.ts';
import { SortToggles } from '@/ui/lib/sort-toggles.ts';

export const useItemTableHead = (sort: ItemSort) => {
  return { directions: SortToggles.directions(sort) };
};
