import dayjs from 'dayjs';
import { type HistoryFilter, HistoryService } from '@/src/services/history';
import { DEFAULT_PAGE_LIMIT } from '@/src/server/constants';
import { Cursors } from '@/src/server/http/cursor';
import { DtoMappers } from '@/src/server/http/dto';
import { Requests } from '@/src/server/http/request';
import { Responses } from '@/src/server/http/responses';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import { beforeCursor, historyQuery } from '@/src/server/http/schemas';

abstract class HistoryHandlers {
  static readonly listHistoryRoute = ({ url }: RouteContext): Response => {
    const query = Requests.parseQuery(url, historyQuery);
    let beforeId: number | null = null;
    if (query.cursor !== undefined) {
      beforeId = Cursors.decodeCursor(query.cursor, beforeCursor).b;
    }
    const filter: HistoryFilter = {
      types: query.type,
      actions: query.action,
      ownedBy: query.entity,
    };
    if (query.from !== undefined) {
      filter.since = dayjs(query.from).toDate();
    }
    if (query.to !== undefined) {
      filter.until = dayjs(query.to - 1).toDate();
    }
    const page = HistoryService.listHistoryPage(
      filter,
      beforeId,
      query.limit ?? DEFAULT_PAGE_LIMIT
    );
    let nextCursor: string | null = null;
    if (page.nextBeforeId !== null) {
      nextCursor = Cursors.encodeCursor({ b: page.nextBeforeId });
    }
    return Responses.json(
      DtoMappers.renderPage(page.events.map(DtoMappers.renderHistoryEvent), nextCursor, page.total)
    );
  };
}

export const historyRoutes: RouteTable = {
  '/api/history': { GET: HistoryHandlers.listHistoryRoute },
};
