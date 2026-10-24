import { ApiError } from '@/ui/lib/api-client.ts';
import type { ItemLists } from '@/ui/lib/item-lists.ts';
import type { ItemSummary } from '@/ui/lib/item-shapes.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import type { ResourceCache } from '@/ui/lib/resource-cache.ts';

export interface DetailGateway<T, P> {
  update: (id: string, patch: P) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

export class DetailMutations<T extends ItemSummary, P> {
  private readonly details: ResourceCache<T>;
  private readonly lists: ItemLists;
  private readonly notices: NoticePort;
  private readonly gateway: DetailGateway<T, P>;
  private readonly merge: (current: T, patch: P) => T;

  constructor(
    details: ResourceCache<T>,
    lists: ItemLists,
    notices: NoticePort,
    gateway: DetailGateway<T, P>,
    merge: (current: T, patch: P) => T
  ) {
    this.details = details;
    this.lists = lists;
    this.notices = notices;
    this.gateway = gateway;
    this.merge = merge;
  }

  patch(id: string, patch: P) {
    return this.update(
      id,
      (current) => {
        return this.merge(current, patch);
      },
      () => {
        return this.gateway.update(id, patch);
      }
    );
  }

  delete(id: string) {
    return this.remove(id, () => {
      return this.gateway.remove(id);
    });
  }

  store(detail: T) {
    this.details.get(detail.id).update(() => {
      return detail;
    });
    this.lists.apply([detail], []);
  }

  private async update(id: string, optimistic: (current: T) => T, send: () => Promise<T>) {
    const detail = this.details.peek(id);
    detail?.update(optimistic);
    try {
      const saved = await send();
      this.store(saved);
      return saved;
    } catch (error) {
      this.notices.error(ApiError.describe(error, `Updating ${id}`));
      await detail?.refresh();
      return null;
    }
  }

  private async remove(id: string, send: () => Promise<void>) {
    try {
      await send();
      this.lists.apply([], [id]);
      this.details.forget(id);
      return true;
    } catch (error) {
      this.notices.error(ApiError.describe(error, `Deleting ${id}`));
      return false;
    }
  }
}
