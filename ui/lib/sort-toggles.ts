import type { ItemSort, SortDirection, SortField } from '@/ui/lib/item-queries.ts';

export abstract class SortToggles {
  private static readonly defaults: Record<SortField, SortDirection> = {
    rank: 'asc',
    updated: 'desc',
    created: 'desc',
    priority: 'asc',
    title: 'asc',
  };

  static next(current: ItemSort, field: SortField): ItemSort {
    if (current.field !== field) {
      return { field, direction: SortToggles.defaults[field] };
    }
    if (current.direction === 'asc') {
      return { field, direction: 'desc' };
    }
    return { field, direction: 'asc' };
  }

  static directions(current: ItemSort): Record<SortField, SortDirection | null> {
    const directions: Record<SortField, SortDirection | null> = {
      rank: null,
      updated: null,
      created: null,
      priority: null,
      title: null,
    };
    directions[current.field] = current.direction;
    return directions;
  }

  static withField(field: SortField): ItemSort {
    return { field, direction: SortToggles.defaults[field] };
  }
}
