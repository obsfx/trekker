import dayjs from 'dayjs';
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IndexPages } from '@/src/server/index-page';
import { ServerListener } from '@/src/server/listen';
import { type TestContext, TestContexts } from '@/tests/helpers/test-context';
import { TestTarget } from '@/tests/helpers/workspace';
import { type ServeHandle, ServeHelpers } from '@/tests/helpers/serve';
import type { ApiError } from '@/tests/server/fixtures';

abstract class ServeTestFixture {
  static occupyPort(): ReturnType<typeof Bun.serve> {
    return Bun.serve({
      hostname: HOSTNAME,
      port: 0,
      fetch: () => {
        return new Response('busy');
      },
    });
  }

  static async waitForFile(path: string, timeoutMs = 5_000): Promise<string> {
    const deadline = dayjs().valueOf() + timeoutMs;
    while (dayjs().valueOf() < deadline) {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8').trim();
        if (content.length > 0) {
          return content;
        }
      }
      await Bun.sleep(25);
    }
    throw new Error(`${path} was not written in time`);
  }
}

const BUILT_INDEX = join(import.meta.dir, '../../dist/webui/index.html.gz');
const HOSTNAME = '127.0.0.1';

describe('listenWithFallback', () => {
  it('falls back to a free port when the port is busy', async () => {
    const busy = ServeTestFixture.occupyPort();
    const busyPort = busy.port ?? 0;
    const listening = ServerListener.listenWithFallback(busyPort, (port) => {
      return Bun.serve({
        hostname: HOSTNAME,
        port,
        fetch: () => {
          return new Response('ok');
        },
      });
    });
    try {
      expect(listening.fellBack).toBe(true);
      expect(listening.requestedPort).toBe(busyPort);
      expect(listening.server.port).not.toBe(busyPort);
      const response = await fetch(`http://${HOSTNAME}:${listening.server.port}/`);
      const body = await response.text();
      expect(body).toBe('ok');
    } finally {
      await listening.server.stop(true);
      await busy.stop(true);
    }
  });

  it('rethrows errors that are not about the port', () => {
    expect(() => {
      return ServerListener.listenWithFallback(4000, () => {
        throw new Error('boom');
      });
    }).toThrow('boom');
  });
});

describe('index page', () => {
  let dir: string;
  let indexPath: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'trekker-index-'));
    indexPath = join(dir, 'index.html.gz');
    writeFileSync(
      indexPath,
      Bun.gzipSync('<!doctype html><html><head><title>t</title></head><body></body></html>')
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const identity = { version: '9.9.9', project: { name: 'demo</script>', root: '/work/demo' } };

  function pageRequest(encoding: string | null): Request {
    const headers: Record<string, string> = { host: 'localhost:4321' };
    if (encoding !== null) {
      headers['accept-encoding'] = encoding;
    }
    return new Request('http://localhost:4321/tasks/TREK-1', { headers });
  }

  it('injects the global before </head> and serves it gzipped', async () => {
    const response = IndexPages.createIndexPage(identity, indexPath).respond(
      pageRequest('gzip, br')
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

    const buffer = await response.arrayBuffer();
    const html = new TextDecoder().decode(Bun.gunzipSync(new Uint8Array(buffer)));
    const script = /<script>window\.__trekkerGlobal=(.*?)<\/script><\/head>/.exec(html);
    expect(script).not.toBeNull();
    expect(script?.[1]).not.toContain('</script>');
    expect(JSON.parse(script?.[1] ?? '')).toEqual({
      baseUrl: 'http://localhost:4321',
      version: '9.9.9',
      project: { name: 'demo</script>', root: '/work/demo' },
    });
  });

  it('serves plain html to clients without gzip', async () => {
    const response = IndexPages.createIndexPage(identity, indexPath).respond(pageRequest(null));
    expect(response.headers.get('content-encoding')).toBeNull();
    const html = await response.text();
    expect(html).toContain('window.__trekkerGlobal=');
  });

  it('answers 503 with a build hint when the UI is not built', async () => {
    const page = IndexPages.createIndexPage(identity, null);
    const response = page.respond(pageRequest('gzip'));
    expect(page.built).toBe(false);
    expect(response.status).toBe(503);
    const html = await response.text();
    expect(html).toContain('bun run build:ui');
  });
});

describe.skipIf(TestTarget.isContainer)('trekker serve command', () => {
  let ctx: TestContext;
  let server: ServeHandle;
  let port: string;

  beforeAll(async () => {
    ctx = TestContexts.createTestContext();
    TestContexts.initTrekker(ctx);
    server = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0');
    port = new URL(server.url).port;
  });

  afterAll(async () => {
    await server?.stop();
    ctx?.cleanup();
  });

  it('prints the URL and the database path', () => {
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(server.output()).toContain(join('.trekker', 'trekker.db'));
  });

  it('serves the UI shell for client routes', async () => {
    for (const path of ['/', '/list', '/history', '/tasks/TREK-1', '/epics/EPIC-1']) {
      const response = await server.request(path);
      if (existsSync(BUILT_INDEX)) {
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('window.__trekkerGlobal=');
      } else {
        expect(response.status).toBe(503);
      }
    }
  });

  it('only answers localhost hosts', async () => {
    const rejected = await server.json<ApiError>('/api/project', {
      headers: { host: 'attacker.example' },
    });
    expect(rejected.status).toBe(403);
    expect(rejected.body.error.code).toBe('forbidden');

    const page = await server.request('/', { headers: { host: 'attacker.example' } });
    expect(page.status).toBe(403);

    for (const host of [`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`]) {
      const accepted = await server.request('/api/project', { headers: { host } });
      expect(accepted.status).toBe(200);
    }
  });

  it('rejects cross-origin writes and allows same-origin ones', async () => {
    const body = { title: 'Guarded' };
    const crossSite = await server.json<ApiError>(
      '/api/epics',
      ServeHelpers.jsonInit('POST', body, {
        'sec-fetch-site': 'cross-site',
        origin: 'http://evil.example',
      })
    );
    expect(crossSite.status).toBe(403);

    const foreignOrigin = await server.json<ApiError>(
      '/api/epics',
      ServeHelpers.jsonInit('POST', body, { origin: 'http://localhost:5173' })
    );
    expect(foreignOrigin.status).toBe(403);

    const sameSite = await server.request(
      '/api/epics',
      ServeHelpers.jsonInit('POST', body, { 'sec-fetch-site': 'same-site' })
    );
    expect(sameSite.status).toBe(403);

    const sameOrigin = await server.request(
      '/api/epics',
      ServeHelpers.jsonInit('POST', body, { 'sec-fetch-site': 'same-origin', origin: server.url })
    );
    expect(sameOrigin.status).toBe(201);

    const matchingOrigin = await server.request(
      '/api/epics',
      ServeHelpers.jsonInit('POST', body, { origin: server.url })
    );
    expect(matchingOrigin.status).toBe(201);

    const crossSiteRead = await server.request('/api/project', {
      headers: { 'sec-fetch-site': 'cross-site' },
    });
    expect(crossSiteRead.status).toBe(200);
  });

  it('falls back to a free port when the requested one is busy', async () => {
    const busy = ServeTestFixture.occupyPort();
    const busyPort = busy.port ?? 0;
    const fallback = await ServeHelpers.startServe(ctx.cwd, `serve --port ${busyPort}`);
    try {
      const actualPort = new URL(fallback.url).port;
      expect(actualPort).not.toBe(String(busyPort));
      expect(fallback.output()).toContain(
        `port ${busyPort} is unavailable, using port ${actualPort}`
      );
      const response = await fallback.request('/api/project');
      expect(response.status).toBe(200);
    } finally {
      await fallback.stop();
      await busy.stop(true);
    }
  });

  it('opens the browser and accepts dev origins with --open --dev', async () => {
    const opened = join(ctx.cwd, 'opened.txt');
    const browser = join(ctx.cwd, 'fake-browser.sh');
    writeFileSync(browser, `#!/bin/sh\necho "$1" > "${opened}"\n`);
    chmodSync(browser, 0o755);

    const dev = await ServeHelpers.startServe(ctx.cwd, 'serve --port 0 --open --dev', {
      BROWSER: browser,
    });
    try {
      const forFile = await ServeTestFixture.waitForFile(opened);
      expect(forFile).toBe(dev.url);

      const devWrite = await dev.request(
        '/api/epics',
        ServeHelpers.jsonInit(
          'POST',
          { title: 'From vite' },
          {
            'sec-fetch-site': 'same-site',
            origin: 'http://localhost:5173',
          }
        )
      );
      expect(devWrite.status).toBe(201);

      const foreign = await dev.request(
        '/api/epics',
        ServeHelpers.jsonInit(
          'POST',
          { title: 'From elsewhere' },
          {
            'sec-fetch-site': 'cross-site',
            origin: 'http://evil.example',
          }
        )
      );
      expect(foreign.status).toBe(403);
    } finally {
      await dev.stop();
    }
  });

  it('rejects an invalid port', () => {
    expect(ctx.runExpectError('serve --port 70000')).toContain('Invalid port');
    expect(ctx.runExpectError('serve -p abc')).toContain('Invalid port');
  });

  it('requires an initialized project', () => {
    const empty = TestContexts.createTestContext();
    try {
      expect(empty.runExpectError('serve --port 0')).toContain('not initialized');
    } finally {
      empty.cleanup();
    }
  });
});
