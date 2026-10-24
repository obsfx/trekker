import * as v from 'valibot';

import { ApiClient } from '@/ui/lib/api-client.ts';
import type { ItemGateway, ItemMove } from '@/ui/lib/gateways.ts';
import { HttpGateway } from '@/ui/lib/http-gateway.ts';
import { ItemQueries, type ItemQuery } from '@/ui/lib/item-queries.ts';
import { ItemShapes } from '@/ui/lib/item-shapes.ts';
import { type SearchQuery, SearchQueries } from '@/ui/lib/search-queries.ts';
import { ValueSchemas } from '@/ui/lib/value-schemas.ts';

export class HttpItemGateway extends HttpGateway implements ItemGateway {
  private static readonly path = '/api/items';
  private static readonly page = ItemShapes.page(ItemShapes.summary);
  private static readonly searchPage = ItemShapes.page(
    v.object({ ...ItemShapes.summaryEntries, snippet: v.fallback(v.nullable(v.string()), null) })
  );
  private static readonly archived = v.object({
    tasks: ValueSchemas.count,
    epics: ValueSchemas.count,
  });

  list(query: ItemQuery, cursor: string | null) {
    const path = ApiClient.withQuery(HttpItemGateway.path, ItemQueries.params(query, cursor));
    return this.api.get(path, HttpItemGateway.page);
  }

  async count(query: ItemQuery) {
    const params = ItemQueries.params(query, null);
    params.set('limit', '1');
    const page = await this.api.get(
      ApiClient.withQuery(HttpItemGateway.path, params),
      HttpItemGateway.page
    );
    return page.total;
  }

  async byIds(ids: string[]) {
    const params = new URLSearchParams({ ids: ids.join(','), limit: String(ids.length) });
    const page = await this.api.get(
      ApiClient.withQuery(HttpItemGateway.path, params),
      HttpItemGateway.page
    );
    return page.items;
  }

  search(query: SearchQuery, cursor: string | null) {
    return this.api.get(
      ApiClient.withQuery('/api/search', SearchQueries.params(query, cursor)),
      HttpItemGateway.searchPage
    );
  }

  move(id: string, move: ItemMove) {
    return this.api.send(
      'POST',
      `${HttpItemGateway.path}/${encodeURIComponent(id)}/move`,
      move,
      ItemShapes.summary
    );
  }

  archiveCompleted() {
    return this.api.send('POST', '/api/archive-completed', undefined, HttpItemGateway.archived);
  }
}
