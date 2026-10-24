import type { ItemKind } from '@/ui/lib/item-kinds.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import type { Page } from '@/ui/lib/item-shapes.ts';

export interface SearchQuery {
  text: string;
  types: readonly ItemKind[];
}

export abstract class SearchQueries {
  static readonly key = (query: SearchQuery) => {
    return `${query.types.join(',')}|${query.text}`;
  };

  static params(query: SearchQuery, cursor: string | null) {
    const params = new URLSearchParams({ q: query.text, limit: String(ItemQueries.pageSize) });
    if (query.types.length > 0) {
      params.set('type', query.types.join(','));
    }
    if (cursor !== null) {
      params.set('cursor', cursor);
    }
    return params;
  }

  static emptyPage<T>(): Page<T> {
    return { items: [], nextCursor: null, total: 0 };
  }
}
