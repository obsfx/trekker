import { ApiError } from '@/ui/lib/api-client.ts';
import type { CommentThreads } from '@/ui/lib/comment-threads.ts';
import { DetailMutations } from '@/ui/lib/detail-mutations.ts';
import type { TaskDetail } from '@/ui/lib/detail-shapes.ts';
import type { TaskDraft, TaskGateway, TaskPatch } from '@/ui/lib/gateways.ts';
import type { ItemLists } from '@/ui/lib/item-lists.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import type { ResourceCache } from '@/ui/lib/resource-cache.ts';

export class TaskActions {
  private readonly gateway: TaskGateway;
  private readonly details: ResourceCache<TaskDetail>;
  private readonly lists: ItemLists;
  private readonly comments: CommentThreads;
  private readonly notices: NoticePort;
  private readonly mutations: DetailMutations<TaskDetail, TaskPatch>;

  constructor(
    gateway: TaskGateway,
    details: ResourceCache<TaskDetail>,
    lists: ItemLists,
    comments: CommentThreads,
    notices: NoticePort
  ) {
    this.gateway = gateway;
    this.details = details;
    this.lists = lists;
    this.comments = comments;
    this.notices = notices;
    this.mutations = new DetailMutations(details, lists, notices, gateway, (task, patch) => {
      return { ...task, ...patch, epic: TaskActions.patchedEpic(task, patch) };
    });
  }

  async create(draft: TaskDraft) {
    try {
      const task = await this.gateway.create(draft);
      this.store(task);
      if (task.parent) {
        this.details.invalidate(task.parent.id);
      }
      return task;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Creating the task'));
      return null;
    }
  }

  update(id: string, patch: TaskPatch) {
    return this.mutations.patch(id, patch);
  }

  remove(id: string) {
    return this.mutations.delete(id);
  }

  async addComment(taskId: string, author: string, content: string) {
    try {
      await this.gateway.addComment(taskId, author, content);
      await this.comments.refresh(taskId);
      this.touchTask(taskId);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Adding the comment'));
      return false;
    }
  }

  async updateComment(taskId: string, id: string, content: string) {
    try {
      await this.gateway.updateComment(id, content);
      await this.comments.refresh(taskId);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Updating the comment'));
      return false;
    }
  }

  async removeComment(taskId: string, id: string) {
    try {
      await this.gateway.removeComment(id);
      await this.comments.refresh(taskId);
      this.touchTask(taskId);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Deleting the comment'));
      return false;
    }
  }

  async addDependency(taskId: string, dependsOnId: string) {
    try {
      const task = await this.gateway.addDependency(taskId, dependsOnId);
      this.store(task);
      this.details.invalidate(dependsOnId);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Linking the dependency'));
      return false;
    }
  }

  async removeDependency(taskId: string, dependsOnId: string) {
    try {
      const task = await this.gateway.removeDependency(taskId, dependsOnId);
      this.store(task);
      this.details.invalidate(dependsOnId);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Removing the dependency'));
      return false;
    }
  }

  private static patchedEpic(task: TaskDetail, patch: TaskPatch) {
    if (patch.epicId === undefined) {
      return task.epic;
    }
    if (patch.epicId === null) {
      return null;
    }
    return task.epic;
  }

  private touchTask(taskId: string) {
    this.details.invalidate(taskId);
    this.lists.refreshIds([taskId]).catch(() => {
      this.lists.invalidateAll();
    });
  }

  private store(task: TaskDetail) {
    this.mutations.store(task);
  }
}
