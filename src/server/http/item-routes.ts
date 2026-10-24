import { ItemMoves } from '@/src/services/item-move';
import { ItemsService } from '@/src/services/items';
import type { ItemFilter, ItemKey, ItemSort } from '@/src/services/items';
import { SearchService } from '@/src/services/search';
import { LIST_ENTITY_TYPES } from '@/src/types';
import { DEFAULT_PAGE_LIMIT } from '@/src/server/constants';
import { Cursors } from '@/src/server/http/cursor';
import { DtoMappers } from '@/src/server/http/dto';
import type { ItemSummaryDto, PageDto, SearchItemDto } from '@/src/server/http/dto';
import { HttpErrors } from '@/src/server/http/errors';
import { Requests } from '@/src/server/http/request';
import { Responses } from '@/src/server/http/responses';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import {
  itemCursor,
  itemsQuery,
  moveBody,
  offsetCursor,
  searchQuery,
} from '@/src/server/http/schemas';

export abstract class ItemHandlers {
  private static sortKey(sort: ItemSort): string {
    return `${sort.field}:${sort.direction}`;
  }

  private static decodeItemCursor(cursor: string | undefined, sort: ItemSort): ItemKey | null {
    if (cursor === undefined) {
      return null;
    }
    const decoded = Cursors.decodeCursor(cursor, itemCursor);
    if (decoded.s !== ItemHandlers.sortKey(sort)) {
      throw HttpErrors.invalidRequest('Cursor does not match the requested sort');
    }
    return { value: decoded.v, id: decoded.i };
  }

  static itemPage(filter: ItemFilter, query: ItemPageQuery): PageDto<ItemSummaryDto> {
    const sort = query.sort ?? DEFAULT_SORT;
    const after = ItemHandlers.decodeItemCursor(query.cursor, sort);
    const page = ItemsService.listItems(filter, sort, after, query.limit ?? DEFAULT_PAGE_LIMIT);
    let nextCursor: string | null = null;
    if (page.nextKey) {
      nextCursor = Cursors.encodeCursor({
        s: ItemHandlers.sortKey(sort),
        v: page.nextKey.value,
        i: page.nextKey.id,
      });
    }
    return DtoMappers.renderPage(
      page.items.map(DtoMappers.renderItemSummary),
      nextCursor,
      page.total
    );
  }

  static readonly listItemsRoute = ({ url }: RouteContext): Response => {
    const query = Requests.parseQuery(url, itemsQuery);
    const ids = query.ids ?? [];
    const filter: ItemFilter = {
      kinds: query.type ?? [],
      statuses: query.status ?? [],
      priorities: query.priority ?? [],
      epicId: query.epic ?? null,
      parentId: query.parent ?? null,
      ids,
    };
    if (query.from !== undefined || query.to !== undefined) {
      filter.dates = {
        field: query.dateField ?? 'updated',
        from: query.from ?? null,
        to: query.to ?? null,
      };
    }
    if (ids.length === 0) {
      return Responses.json(ItemHandlers.itemPage(filter, query));
    }
    const page = ItemsService.listItems(filter, query.sort ?? DEFAULT_SORT, null, ids.length);
    return Responses.json(
      DtoMappers.renderPage(page.items.map(DtoMappers.renderItemSummary), null, page.items.length)
    );
  };

  static readonly searchRoute = ({ url }: RouteContext): Response => {
    const query = Requests.parseQuery(url, searchQuery);
    let offset = 0;
    if (query.cursor !== undefined) {
      offset = Cursors.decodeCursor(query.cursor, offsetCursor).o;
    }
    let types = query.type ?? [];
    if (types.length === 0) {
      types = [...LIST_ENTITY_TYPES];
    }
    const result = SearchService.search(query.q, {
      types,
      statuses: query.status,
      limit: query.limit ?? DEFAULT_PAGE_LIMIT,
      offset,
    });

    const snippets = new Map(
      result.results.map((hit) => {
        return [hit.id, hit.snippet];
      })
    );
    const items: SearchItemDto[] = ItemsService.getItemSummaries(
      result.results.map((hit) => {
        return hit.id;
      })
    ).map((item) => {
      return {
        ...DtoMappers.renderItemSummary(item),
        snippet: snippets.get(item.id) ?? null,
      };
    });

    const nextOffset = offset + result.results.length;
    let nextCursor: string | null = null;
    if (result.results.length > 0 && nextOffset < result.total) {
      nextCursor = Cursors.encodeCursor({ o: nextOffset });
    }
    return Responses.json(DtoMappers.renderPage(items, nextCursor, result.total));
  };

  static readonly moveItemRoute = async ({ request, params }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, moveBody);
    return Responses.json(
      DtoMappers.renderItemSummary(ItemMoves.moveItem({ id: params.id, ...body }))
    );
  };
}

interface ItemPageQuery {
  sort?: ItemSort;
  cursor?: string;
  limit?: number;
}

const DEFAULT_SORT: ItemSort = { field: 'updated', direction: 'desc' };

export const itemRoutes: RouteTable = {
  '/api/items': { GET: ItemHandlers.listItemsRoute },
  '/api/items/:id/move': { POST: ItemHandlers.moveItemRoute },
  '/api/search': { GET: ItemHandlers.searchRoute },
};
