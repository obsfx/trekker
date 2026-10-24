import { ApiError } from '@/ui/lib/api-client.ts';
import type { EpicDetail } from '@/ui/lib/detail-shapes.ts';
import { DetailMutations } from '@/ui/lib/detail-mutations.ts';
import type { EpicDraft, EpicGateway, EpicPatch } from '@/ui/lib/gateways.ts';
import type { ItemLists } from '@/ui/lib/item-lists.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import type { ResourceCache } from '@/ui/lib/resource-cache.ts';

export class EpicActions {
  private readonly gateway: EpicGateway;
  private readonly notices: NoticePort;
  private readonly mutations: DetailMutations<EpicDetail, EpicPatch>;

  constructor(
    gateway: EpicGateway,
    details: ResourceCache<EpicDetail>,
    lists: ItemLists,
    notices: NoticePort
  ) {
    this.gateway = gateway;
    this.notices = notices;
    this.mutations = new DetailMutations(details, lists, notices, gateway, (epic, patch) => {
      return { ...epic, ...patch };
    });
  }

  async create(draft: EpicDraft) {
    try {
      const epic = await this.gateway.create(draft);
      this.mutations.store(epic);
      return epic;
    } catch (error) {
      this.notices.error(ApiError.describe(error, 'Creating the epic'));
      return null;
    }
  }

  update(id: string, patch: EpicPatch) {
    return this.mutations.patch(id, patch);
  }

  remove(id: string) {
    return this.mutations.delete(id);
  }
}
