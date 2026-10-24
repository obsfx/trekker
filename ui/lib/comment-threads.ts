import type { TaskComment } from '@/ui/lib/detail-shapes.ts';
import type { TaskGateway } from '@/ui/lib/gateways.ts';
import { PagedListRegistry } from '@/ui/lib/paged-list-registry.ts';

export class CommentThreads {
  private readonly registry: PagedListRegistry<string, TaskComment>;

  constructor(gateway: TaskGateway, gate: () => Promise<void> = CommentThreads.open) {
    this.registry = new PagedListRegistry(
      (taskId) => {
        return taskId;
      },
      async (taskId, cursor) => {
        await gate();
        return gateway.comments(taskId, cursor);
      },
      CommentThreads.idOf
    );
  }

  private static readonly open = () => {
    return Promise.resolve();
  };

  private static readonly idOf = (comment: TaskComment) => {
    return comment.id;
  };

  get(taskId: string) {
    return this.registry.get(taskId);
  }

  refresh(taskId: string) {
    const thread = this.registry.all().find(({ query }) => {
      return query === taskId;
    });
    if (!thread) {
      return Promise.resolve();
    }
    if (!thread.list.watched) {
      thread.list.invalidate();
      return Promise.resolve();
    }
    return thread.list.refreshLoaded();
  }

  invalidateAll() {
    this.registry.invalidateAll();
  }
}
