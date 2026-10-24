import type { ProjectGateway } from '@/ui/lib/gateways.ts';
import { HttpGateway } from '@/ui/lib/http-gateway.ts';
import { ProjectShapes } from '@/ui/lib/project-shapes.ts';

export class HttpProjectGateway extends HttpGateway implements ProjectGateway {
  load() {
    return this.api.get('/api/project', ProjectShapes.project);
  }

  updateConfig(config: Record<string, string>) {
    return this.api.send('PATCH', '/api/project/config', config, ProjectShapes.project);
  }
}
