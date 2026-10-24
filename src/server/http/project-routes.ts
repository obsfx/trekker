import { ArchiveService } from '@/src/services/archive';
import { ConfigService } from '@/src/services/config';
import { ProjectService } from '@/src/services/project';
import type { ArchiveResultDto, ProjectDto } from '@/src/server/http/dto';
import { Requests } from '@/src/server/http/request';
import { Responses } from '@/src/server/http/responses';
import type { RouteContext, RouteTable } from '@/src/server/http/route';
import { configBody } from '@/src/server/http/schemas';

export abstract class ProjectHandlers {
  static projectRoutes(identity: ProjectIdentity): RouteTable {
    function renderProject(): ProjectDto {
      const summary = ProjectService.getProjectSummary(identity.root);
      return {
        name: summary.name,
        root: identity.root,
        version: identity.version,
        config: ConfigService.listProjectConfig(),
        counts: summary.counts,
      };
    }

    async function updateConfigRoute({ request }: RouteContext): Promise<Response> {
      const body = await Requests.parseBody(request, configBody);
      ConfigService.setProjectConfigValues(body);
      return Responses.json(renderProject());
    }

    function archiveCompletedRoute(): Response {
      const result: ArchiveResultDto = ArchiveService.archiveCompleted();
      return Responses.json(result);
    }

    return {
      '/api/project': {
        GET: () => {
          return Responses.json(renderProject());
        },
      },
      '/api/project/config': { PATCH: updateConfigRoute },
      '/api/archive-completed': { POST: archiveCompletedRoute },
    };
  }
}

export interface ProjectIdentity {
  root: string;
  version: string;
}
