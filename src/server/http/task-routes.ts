import { CommentService } from '@/src/services/comment';
import { DependencyService } from '@/src/services/dependency';
import { ItemDetails } from '@/src/services/item-detail';
import type { TaskDetail } from '@/src/services/item-detail';
import { TaskService } from '@/src/services/task';
import { DEFAULT_PAGE_LIMIT } from '@/src/server/constants';
import { Cursors } from '@/src/server/http/cursor';
import { DtoMappers } from '@/src/server/http/dto';
import { HttpErrors } from '@/src/server/http/errors';
import { Requests } from '@/src/server/http/request';
import { Responses } from '@/src/server/http/responses';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import {
  createCommentBody,
  createTaskBody,
  dependencyBody,
  pageQuery,
  sequenceCursor,
  updateCommentBody,
  updateTaskBody,
} from '@/src/server/http/schemas';

abstract class TaskHandlers {
  private static requireTaskDetail(id: string): TaskDetail {
    const task = ItemDetails.getTaskDetail(id);
    if (!task) {
      throw HttpErrors.notFound(`Task not found: ${id}`);
    }
    return task;
  }

  static readonly getTaskRoute = ({ params }: RouteContext): Response => {
    return Responses.json(DtoMappers.renderTaskDetail(TaskHandlers.requireTaskDetail(params.id)));
  };

  static readonly createTaskRoute = async ({ request }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, createTaskBody);
    const task = TaskService.createTask({
      title: body.title,
      description: body.description ?? undefined,
      priority: body.priority,
      status: body.status,
      epicId: body.epicId ?? undefined,
      parentTaskId: body.parentTaskId ?? undefined,
      tags: body.tags ?? undefined,
    });
    return Responses.created(DtoMappers.renderTaskDetail(TaskHandlers.requireTaskDetail(task.id)));
  };

  static readonly updateTaskRoute = async ({
    request,
    params,
  }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, updateTaskBody);
    TaskService.updateTask(params.id, body);
    return Responses.json(DtoMappers.renderTaskDetail(TaskHandlers.requireTaskDetail(params.id)));
  };

  static readonly deleteTaskRoute = ({ params }: RouteContext): Response => {
    TaskService.deleteTask(params.id);
    return Responses.noContent();
  };

  static readonly listCommentsRoute = ({ url, params }: RouteContext): Response => {
    const query = Requests.parseQuery(url, pageQuery);
    let after: number | null = null;
    if (query.cursor !== undefined) {
      after = Cursors.decodeCursor(query.cursor, sequenceCursor).r;
    }
    const page = CommentService.listCommentPage(
      params.id,
      after,
      query.limit ?? DEFAULT_PAGE_LIMIT
    );
    let nextCursor: string | null = null;
    if (page.nextSequence !== null) {
      nextCursor = Cursors.encodeCursor({ r: page.nextSequence });
    }
    return Responses.json(
      DtoMappers.renderPage(page.items.map(DtoMappers.renderComment), nextCursor, page.total)
    );
  };

  static readonly addCommentRoute = async ({
    request,
    params,
  }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, createCommentBody);
    const comment = CommentService.createComment({
      taskId: params.id,
      author: body.author,
      content: body.content,
    });
    return Responses.created(DtoMappers.renderComment(comment));
  };

  static readonly updateCommentRoute = async ({
    request,
    params,
  }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, updateCommentBody);
    return Responses.json(DtoMappers.renderComment(CommentService.updateComment(params.id, body)));
  };

  static readonly deleteCommentRoute = ({ params }: RouteContext): Response => {
    CommentService.deleteComment(params.id);
    return Responses.noContent();
  };

  static readonly addDependencyRoute = async ({
    request,
    params,
  }: RouteContext): Promise<Response> => {
    const body = await Requests.parseBody(request, dependencyBody);
    DependencyService.addDependency(params.id, body.dependsOnId);
    return Responses.created(
      DtoMappers.renderTaskDetail(TaskHandlers.requireTaskDetail(params.id))
    );
  };

  static readonly removeDependencyRoute = ({ params }: RouteContext): Response => {
    DependencyService.removeDependency(params.id, params.dependsOnId);
    return Responses.json(DtoMappers.renderTaskDetail(TaskHandlers.requireTaskDetail(params.id)));
  };
}

export const taskRoutes: RouteTable = {
  '/api/tasks': { POST: TaskHandlers.createTaskRoute },
  '/api/tasks/:id': {
    GET: TaskHandlers.getTaskRoute,
    PATCH: TaskHandlers.updateTaskRoute,
    DELETE: TaskHandlers.deleteTaskRoute,
  },
  '/api/tasks/:id/comments': {
    GET: TaskHandlers.listCommentsRoute,
    POST: TaskHandlers.addCommentRoute,
  },
  '/api/tasks/:id/dependencies': { POST: TaskHandlers.addDependencyRoute },
  '/api/tasks/:id/dependencies/:dependsOnId': { DELETE: TaskHandlers.removeDependencyRoute },
  '/api/comments/:id': {
    PATCH: TaskHandlers.updateCommentRoute,
    DELETE: TaskHandlers.deleteCommentRoute,
  },
};
