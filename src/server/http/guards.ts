import { HttpErrors } from '@/src/server/http/errors';
import type { HttpError } from '@/src/server/http/errors';

export abstract class RequestGuards {
  private static hostnameOf(host: string): string | null {
    try {
      return new URL(`http://${host}`).hostname;
    } catch {
      return null;
    }
  }

  private static isLocalHost(host: string | null): boolean {
    if (host === null) {
      return false;
    }
    const hostname = RequestGuards.hostnameOf(host);
    return hostname !== null && LOCAL_HOSTNAMES.has(hostname);
  }

  private static isSameOriginWrite(request: Request, dev: boolean): boolean {
    if (READ_METHODS.has(request.method)) {
      return true;
    }
    const origin = request.headers.get('origin');
    if (dev && origin !== null && DEV_ORIGIN.test(origin)) {
      return true;
    }
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite !== null) {
      return SAFE_FETCH_SITES.has(fetchSite);
    }
    if (origin !== null) {
      return origin === `http://${request.headers.get('host') ?? ''}`;
    }
    return true;
  }

  static guardRequest(request: Request, dev: boolean): HttpError | null {
    if (!RequestGuards.isLocalHost(request.headers.get('host'))) {
      return HttpErrors.forbidden('Only localhost hosts are allowed');
    }
    if (!RequestGuards.isSameOriginWrite(request, dev)) {
      return HttpErrors.forbidden('Cross-origin writes are not allowed');
    }
    return null;
  }
}

const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]']);
const SAFE_FETCH_SITES: ReadonlySet<string> = new Set(['same-origin', 'none']);
const READ_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
