import { DetailShapes } from '@/ui/lib/detail-shapes.ts';
import type { EpicDraft, EpicGateway, EpicPatch } from '@/ui/lib/gateways.ts';
import { HttpGateway } from '@/ui/lib/http-gateway.ts';

export class HttpEpicGateway extends HttpGateway implements EpicGateway {
  private static epicPath(id: string) {
    return `/api/epics/${encodeURIComponent(id)}`;
  }

  get(id: string) {
    return this.api.get(HttpEpicGateway.epicPath(id), DetailShapes.epic);
  }

  create(draft: EpicDraft) {
    return this.api.send('POST', '/api/epics', draft, DetailShapes.epic);
  }

  update(id: string, patch: EpicPatch) {
    return this.api.send('PATCH', HttpEpicGateway.epicPath(id), patch, DetailShapes.epic);
  }

  remove(id: string) {
    return this.api.sendWithoutContent('DELETE', HttpEpicGateway.epicPath(id));
  }
}
