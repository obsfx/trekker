import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HTTP_SERVICE_UNAVAILABLE, RENDERED_PAGE_CACHE_LIMIT } from '@/src/server/constants';
import type { TrekkerGlobal } from '@/src/server/http/dto';

export abstract class IndexPages {
  private static findIndexFile(): string | null {
    for (const candidate of INDEX_CANDIDATES) {
      const path = fileURLToPath(new URL(candidate, import.meta.url));
      if (existsSync(path)) {
        return path;
      }
    }
    return null;
  }

  private static globalsScript(globals: TrekkerGlobal): string {
    const payload = JSON.stringify(globals).replaceAll('<', '\\u003c');
    return `<script>window.__trekkerGlobal=${payload}</script>`;
  }

  private static render(html: string, globals: TrekkerGlobal): RenderedPage {
    let raw = `${IndexPages.globalsScript(globals)}${html}`;
    const headClose = html.indexOf(HEAD_CLOSE);
    if (headClose !== -1) {
      raw = `${html.slice(0, headClose)}${IndexPages.globalsScript(globals)}${html.slice(headClose)}`;
    }
    return { raw, gzipped: Bun.gzipSync(raw) };
  }

  private static notBuiltPage(): IndexPage {
    return {
      built: false,
      respond: () => {
        return new Response(NOT_BUILT_MESSAGE, {
          status: HTTP_SERVICE_UNAVAILABLE,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      },
    };
  }

  static createIndexPage(
    identity: PageIdentity,
    path: string | null = IndexPages.findIndexFile()
  ): IndexPage {
    if (path === null) {
      return IndexPages.notBuiltPage();
    }
    const html = new TextDecoder().decode(Bun.gunzipSync(readFileSync(path)));
    const pages = new Map<string, RenderedPage>();

    function pageFor(host: string): RenderedPage {
      const cached = pages.get(host);
      if (cached) {
        return cached;
      }
      const page = IndexPages.render(html, { baseUrl: `http://${host}`, ...identity });
      if (pages.size < RENDERED_PAGE_CACHE_LIMIT) {
        pages.set(host, page);
      }
      return page;
    }

    return {
      built: true,
      respond(request) {
        const page = pageFor(request.headers.get('host') ?? '');
        const headers = new Headers({
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
          vary: 'accept-encoding',
        });
        if (request.headers.get('accept-encoding')?.includes('gzip')) {
          headers.set('content-encoding', 'gzip');
          return new Response(page.gzipped, { headers });
        }
        return new Response(page.raw, { headers });
      },
    };
  }
}

const INDEX_CANDIDATES = ['./webui/index.html.gz', '../../dist/webui/index.html.gz'];
const NOT_BUILT_MESSAGE =
  'The trekker web UI is not built. Run `bun run build:ui` and restart `trekker serve`.';
const HEAD_CLOSE = '</head>';

interface RenderedPage {
  raw: string;
  gzipped: Uint8Array;
}

export type PageIdentity = Omit<TrekkerGlobal, 'baseUrl'>;

export interface IndexPage {
  built: boolean;
  respond: (request: Request) => Response;
}
