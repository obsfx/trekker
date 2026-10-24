import { ApiClient } from '@/ui/lib/api-client.ts';
import { DetailShapes } from '@/ui/lib/detail-shapes.ts';
import type { TaskDraft, TaskGateway, TaskPatch } from '@/ui/lib/gateways.ts';
import { HttpGateway } from '@/ui/lib/http-gateway.ts';
import { ItemQueries } from '@/ui/lib/item-queries.ts';
import { ItemShapes } from '@/ui/lib/item-shapes.ts';

export class HttpTaskGateway extends HttpGateway implements TaskGateway {
  private static readonly commentPage = ItemShapes.page(DetailShapes.comment);

  private static taskPath(id: string) {
    return `/api/tasks/${encodeURIComponent(id)}`;
  }

  get(id: string) {
    return this.api.get(HttpTaskGateway.taskPath(id), DetailShapes.task);
  }

  create(draft: TaskDraft) {
    return this.api.send('POST', '/api/tasks', draft, DetailShapes.task);
  }

  update(id: string, patch: TaskPatch) {
    return this.api.send('PATCH', HttpTaskGateway.taskPath(id), patch, DetailShapes.task);
  }

  remove(id: string) {
    return this.api.sendWithoutContent('DELETE', HttpTaskGateway.taskPath(id));
  }

  comments(taskId: string, cursor: string | null) {
    const params = new URLSearchParams({ limit: String(ItemQueries.pageSize) });
    if (cursor) {
      params.set('cursor', cursor);
    }
    return this.api.get(
      ApiClient.withQuery(`${HttpTaskGateway.taskPath(taskId)}/comments`, params),
      HttpTaskGateway.commentPage
    );
  }

  addComment(taskId: string, author: string, content: string) {
    return this.api.send(
      'POST',
      `${HttpTaskGateway.taskPath(taskId)}/comments`,
      { author, content },
      DetailShapes.comment
    );
  }

  updateComment(id: string, content: string) {
    return this.api.send(
      'PATCH',
      `/api/comments/${encodeURIComponent(id)}`,
      { content },
      DetailShapes.comment
    );
  }

  removeComment(id: string) {
    return this.api.sendWithoutContent('DELETE', `/api/comments/${encodeURIComponent(id)}`);
  }

  addDependency(taskId: string, dependsOnId: string) {
    return this.api.send(
      'POST',
      `${HttpTaskGateway.taskPath(taskId)}/dependencies`,
      { dependsOnId },
      DetailShapes.task
    );
  }

  removeDependency(taskId: string, dependsOnId: string) {
    return this.api.send(
      'DELETE',
      `${HttpTaskGateway.taskPath(taskId)}/dependencies/${encodeURIComponent(dependsOnId)}`,
      undefined,
      DetailShapes.task
    );
  }
}
