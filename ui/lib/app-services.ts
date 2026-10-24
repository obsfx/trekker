import { ApiClient } from '@/ui/lib/api-client.ts';
import { AppGlobals } from '@/ui/lib/app-globals.ts';
import { HttpEpicGateway } from '@/ui/lib/http-epic-gateway.ts';
import { HttpHistoryGateway } from '@/ui/lib/http-history-gateway.ts';
import { HttpItemGateway } from '@/ui/lib/http-item-gateway.ts';
import { HttpProjectGateway } from '@/ui/lib/http-project-gateway.ts';
import { HttpTaskGateway } from '@/ui/lib/http-task-gateway.ts';
import type { NoticePort } from '@/ui/lib/notices.ts';
import { Services } from '@/ui/lib/services.ts';
import { SseEventStream } from '@/ui/lib/sse-event-stream.ts';

export abstract class AppServices {
  static create(notices: NoticePort) {
    const globals = AppGlobals.read();
    const api = new ApiClient(globals.baseUrl);
    return new Services(
      {
        items: new HttpItemGateway(api),
        tasks: new HttpTaskGateway(api),
        epics: new HttpEpicGateway(api),
        history: new HttpHistoryGateway(api),
        project: new HttpProjectGateway(api),
        events: new SseEventStream(api.url('/api/events')),
      },
      notices
    );
  }
}
