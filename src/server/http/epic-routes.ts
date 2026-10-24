import { EpicService } from '@/src/services/epic';
import { ItemDetails } from '@/src/services/item-detail';
import type { EpicDetail } from '@/src/services/item-detail';
import { DtoMappers } from '@/src/server/http/dto';
import { HttpErrors } from '@/src/server/http/errors';
import { ItemHandlers } from '@/src/server/http/item-routes';
import { Requests } from '@/src/server/http/request';
import { Responses } from '@/src/server/http/responses';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import { createEpicBody, epicTasksQuery, updateEpicBody } from '@/src/server/http/schemas';

abstract class EpicHandlers {
  private static requireEpicDetail(id: string): EpicDetail {
    const epic = ItemDetails.getEpicDetail(id);
    if (!epic) {
      throw HttpErrors.notFound(`Epic not found: ${id}`);
    }
    return epic;
  }

  static readonly getEpicRoute = ({ params }: RouteContext): Response => {
    return Responses.json(DtoMappers.renderEpicDetail(EpicHandlers.requireEpicDetail(params.id)));
  };

  static readonly createEpicRoute = async ({ request }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, createEpicBody);
    const epic = EpicService.createEpic({
      title: body.title,
      description: body.description ?? undefined,
      priority: body.priority,
      status: body.status,
    });
    return Responses.created(DtoMappers.renderEpicDetail(EpicHandlers.requireEpicDetail(epic.id)));
  };

  static readonly updateEpicRoute = async ({
    request,
    params,
  }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, updateEpicBody);
    EpicService.updateEpic(params.id, body);
    return Responses.json(DtoMappers.renderEpicDetail(EpicHandlers.requireEpicDetail(params.id)));
  };

  static readonly deleteEpicRoute = ({ params }: RouteContext): Response => {
    EpicService.deleteEpic(params.id);
    return Responses.noContent();
  };

  static readonly listEpicTasksRoute = ({ url, params }: RouteContext): Response => {
    const query = Requests.parseQuery(url, epicTasksQuery);
    if (!EpicService.getEpic(params.id)) {
      throw HttpErrors.notFound(`Epic not found: ${params.id}`);
    }
    return Responses.json(
      ItemHandlers.itemPage(
        {
          kinds: ['task'],
          statuses: query.status ?? [],
          priorities: [],
          epicId: params.id,
          parentId: null,
          ids: [],
        },
        query
      )
    );
  };
}

export const epicRoutes: RouteTable = {
  '/api/epics': { POST: EpicHandlers.createEpicRoute },
  '/api/epics/:id': {
    GET: EpicHandlers.getEpicRoute,
    PATCH: EpicHandlers.updateEpicRoute,
    DELETE: EpicHandlers.deleteEpicRoute,
  },
  '/api/epics/:id/tasks': { GET: EpicHandlers.listEpicTasksRoute },
};
