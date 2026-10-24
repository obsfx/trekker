export interface RequestTimeouts {
  timeout: (request: Request, seconds: number) => void;
}

export interface RouteContext {
  request: Request;
  url: URL;
  params: Record<string, string>;
  server: RequestTimeouts;
}

export type RouteHandler = (context: RouteContext) => Response | Promise<Response>;

export const ROUTE_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;

export type RouteMethod = (typeof ROUTE_METHODS)[number];

export type RouteTable = Record<string, Partial<Record<RouteMethod, RouteHandler>>>;
