import { ApiClient } from '@/ui/lib/api-client.ts';
import type { HistoryGateway } from '@/ui/lib/gateways.ts';
import { type HistoryQuery, HistoryShapes } from '@/ui/lib/history-shapes.ts';
import { HttpGateway } from '@/ui/lib/http-gateway.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { ItemShapes } from '@/ui/lib/item-shapes.ts';

export class HttpHistoryGateway extends HttpGateway implements HistoryGateway {
  private static readonly page = ItemShapes.page(HistoryShapes.event);

  list(query: HistoryQuery, cursor: string | null) {
    const params = HistoryShapes.params(query, cursor, ItemQueries.pageSize);
    return this.api.get(ApiClient.withQuery('/api/history', params), HttpHistoryGateway.page);
  }
}
