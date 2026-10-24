import * as v from 'valibot';

import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { ItemStatus } from '@/ui/lib/item-statuses.ts';
import type { Priority } from '@/ui/lib/priorities.ts';

const SORT_FIELDS = ['rank', 'updated', 'created', 'priority', 'title'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export type DateField = 'created' | 'updated';

export interface DateRange {
  field: DateField;
  from: number | null;
  to: number | null;
}

export interface ItemSort {
  field: SortField;
  direction: SortDirection;
}

export interface ItemQuery {
  types: ItemKind[];
  statuses: ItemStatus[];
  priorities: Priority[];
  epicId: string | null;
  parentId: string | null;
  dates: DateRange | null;
  sort: ItemSort;
}

export abstract class ItemQueries {
  static readonly pageSize = 50;

  static readonly manualSort: ItemSort = { field: 'rank', direction: 'asc' };
  static readonly recentSort: ItemSort = { field: 'updated', direction: 'desc' };

  static readonly sortFields: readonly SortField[] = SORT_FIELDS;

  static readonly sortSchema = v.object({
    field: v.picklist(SORT_FIELDS),
    direction: v.picklist(SORT_DIRECTIONS),
  });

  private static readonly sortLabels: Record<SortField, string> = {
    rank: 'Manual',
    updated: 'Last updated',
    created: 'Created',
    priority: 'Priority',
    title: 'Title',
  };

  static empty(sort: ItemSort): ItemQuery {
    return {
      types: [],
      statuses: [],
      priorities: [],
      epicId: null,
      parentId: null,
      dates: null,
      sort,
    };
  }

  static sortLabel(field: SortField) {
    return ItemQueries.sortLabels[field];
  }

  static key(query: ItemQuery) {
    return JSON.stringify([
      [...query.types].sort(),
      [...query.statuses].sort(),
      [...query.priorities].sort(),
      query.epicId,
      query.parentId,
      query.dates?.field ?? null,
      query.dates?.from ?? null,
      query.dates?.to ?? null,
      query.sort.field,
      query.sort.direction,
    ]);
  }

  static params(query: ItemQuery, cursor: string | null) {
    const params = new URLSearchParams();
    if (query.types.length > 0) {
      params.set('type', query.types.join(','));
    }
    if (query.statuses.length > 0) {
      params.set('status', query.statuses.join(','));
    }
    if (query.priorities.length > 0) {
      params.set('priority', query.priorities.join(','));
    }
    if (query.epicId) {
      params.set('epic', query.epicId);
    }
    if (query.parentId) {
      params.set('parent', query.parentId);
    }
    if (query.dates) {
      params.set('dateField', query.dates.field);
      if (query.dates.from !== null) {
        params.set('from', String(query.dates.from));
      }
      if (query.dates.to !== null) {
        params.set('to', String(query.dates.to));
      }
    }
    params.set('sort', `${query.sort.field}:${query.sort.direction}`);
    params.set('limit', String(ItemQueries.pageSize));
    if (cursor) {
      params.set('cursor', cursor);
    }
    return params;
  }

  static matches(query: ItemQuery, item: ItemSummary) {
    if (query.types.length > 0 && !query.types.includes(item.kind)) {
      return false;
    }
    if (query.statuses.length > 0 && !query.statuses.includes(item.status)) {
      return false;
    }
    if (query.priorities.length > 0 && !query.priorities.includes(item.priority)) {
      return false;
    }
    if (query.epicId && item.epic?.id !== query.epicId) {
      return false;
    }
    if (query.parentId && item.parent?.id !== query.parentId) {
      return false;
    }
    return ItemQueries.inRange(query.dates, item);
  }

  static compare(sort: ItemSort) {
    const sign = sort.direction === 'asc' ? 1 : -1;
    return (left: ItemSummary, right: ItemSummary) => {
      const order = ItemQueries.compareField(sort.field, left, right) * sign;
      if (order !== 0) {
        return order;
      }
      return ItemQueries.compareText(left.id, right.id) * sign;
    };
  }

  private static inRange(range: DateRange | null, item: ItemSummary) {
    if (!range) {
      return true;
    }
    const value = range.field === 'created' ? item.createdAt : item.updatedAt;
    if (range.from !== null && value < range.from) {
      return false;
    }
    return range.to === null || value < range.to;
  }

  private static compareField(field: SortField, left: ItemSummary, right: ItemSummary) {
    switch (field) {
      case 'rank': {
        return ItemQueries.compareText(left.rank ?? '', right.rank ?? '');
      }
      case 'updated': {
        return left.updatedAt - right.updatedAt;
      }
      case 'created': {
        return left.createdAt - right.createdAt;
      }
      case 'priority': {
        return left.priority - right.priority;
      }
      case 'title': {
        return ItemQueries.compareText(left.title, right.title);
      }
    }
  }

  private static compareText(left: string, right: string) {
    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
    return 0;
  }
}
