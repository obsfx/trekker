import type { BunRequest, Server } from 'bun';
import pkg from '@/package.json';
import { DbClient } from '@/src/db/client';
import { HistoryService } from '@/src/services/history';
import { ProjectService } from '@/src/services/project';
import { LISTEN_HOSTNAME } from '@/src/server/constants';
import { EventFeed } from '@/src/server/event-feed';
import { epicRoutes } from '@/src/server/http/epic-routes';
import { HttpErrors } from '@/src/server/http/errors';
import { EventHandlers } from '@/src/server/http/event-routes';
import { RequestGuards } from '@/src/server/http/guards';
import { historyRoutes } from '@/src/server/http/history-routes';
import { itemRoutes } from '@/src/server/http/item-routes';
import { ProjectHandlers } from '@/src/server/http/project-routes';
import { Responses } from '@/src/server/http/responses';
import { ROUTE_METHODS } from '@/src/server/http/route';
import type { RouteHandler, RouteMethod, RouteTable } from '@/src/server/http/route';
import { taskRoutes } from '@/src/server/http/task-routes';
import { IndexPages } from '@/src/server/index-page';
import type { IndexPage } from '@/src/server/index-page';
import { ServerListener } from '@/src/server/listen';

export abstract class ServerApp {
  private static isApiPath(pathname: string): boolean {
    return pathname === '/api' || pathname.startsWith('/api/');
  }

  private static guarded(handler: RouteHandler, dev: boolean, feed: EventFeed): BunHandler {
    return async (request, server) => {
      const rejection = RequestGuards.guardRequest(request, dev);
      if (rejection) {
        return Responses.errorResponse(rejection);
      }
      try {
        const response = await handler({
          request,
          url: new URL(request.url),
          params: request.params,
          server,
        });
        return response;
      } catch (error) {
        return Responses.errorResponse(HttpErrors.toHttpError(error));
      } finally {
        if (request.method !== 'GET') {
          feed.poke();
        }
      }
    };
  }

  private static buildRoutes(
    tables: readonly RouteTable[],
    dev: boolean,
    feed: EventFeed
  ): BunRoutes {
    const routes: BunRoutes = {};
    for (const table of tables) {
      for (const [path, methods] of Object.entries(table)) {
        const wrapped: Partial<Record<RouteMethod, BunHandler>> = {};
        for (const method of ROUTE_METHODS) {
          const handler = methods[method];
          if (handler) {
            wrapped[method] = ServerApp.guarded(handler, dev, feed);
          }
        }
        routes[path] = wrapped;
      }
    }
    return routes;
  }

  private static fallback(indexPage: IndexPage, dev: boolean): (request: Request) => Response {
    return (request) => {
      const rejection = RequestGuards.guardRequest(request, dev);
      if (rejection) {
        return Responses.errorResponse(rejection);
      }
      const { pathname } = new URL(request.url);
      if (!ServerApp.isApiPath(pathname) && request.method === 'GET') {
        return indexPage.respond(request);
      }
      return Responses.errorResponse(
        HttpErrors.notFound(`No route for ${request.method} ${pathname}`)
      );
    };
  }

  static startServer(options: ServeOptions): RunningServer {
    DbClient.getDb(options.cwd);
    const feed = new EventFeed({
      latestId: HistoryService.getLatestEventId,
      after: HistoryService.listEventsAfter,
      dataVersion: DbClient.getDataVersion,
    });
    const project = ProjectService.getProjectSummary(options.cwd);
    const indexPage = IndexPages.createIndexPage({
      version: pkg.version,
      project: { name: project.name, root: options.cwd },
    });
    const routes = ServerApp.buildRoutes(
      [
        itemRoutes,
        taskRoutes,
        epicRoutes,
        historyRoutes,
        ProjectHandlers.projectRoutes({ root: options.cwd, version: pkg.version }),
        EventHandlers.eventRoutes(feed),
      ],
      options.dev,
      feed
    );
    const fetch = ServerApp.fallback(indexPage, options.dev);

    const listening = ServerListener.listenWithFallback(options.port, (port) => {
      return Bun.serve({ hostname: LISTEN_HOSTNAME, port, routes, fetch });
    });
    const port = listening.server.port ?? options.port;

    return {
      url: `http://${LISTEN_HOSTNAME}:${port}`,
      port,
      requestedPort: listening.requestedPort,
      fellBack: listening.fellBack,
      dbPath: DbClient.getDbPath(options.cwd),
      uiBuilt: indexPage.built,
      async stop() {
        feed.stop();
        await listening.server.stop(true);
      },
    };
  }
}

export interface ServeOptions {
  port: number;
  dev: boolean;
  cwd: string;
}

export interface RunningServer {
  url: string;
  port: number;
  requestedPort: number;
  fellBack: boolean;
  dbPath: string;
  uiBuilt: boolean;
  stop: () => Promise<void>;
}

type BunHandler = (request: BunRequest, server: Server<undefined>) => Promise<Response>;
type BunRoutes = Record<string, Partial<Record<RouteMethod, BunHandler>>>;
