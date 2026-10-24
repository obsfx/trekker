import { join } from 'node:path';
import { TestContexts } from '@/tests/helpers/test-context';

export abstract class ServeHelpers {
  private static async readUntilServing(
    stdout: ReadableStream<Uint8Array>,
    append: (text: string) => void,
    current: () => string
  ): Promise<string> {
    const reader = stdout.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const match = SERVING_LINE.exec(current());
      if (match) {
        void (async () => {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              return;
            }
            append(decoder.decode(value));
          }
        })();
        return match[1];
      }
      const { done, value } = await reader.read();
      if (done) {
        throw new Error(`serve exited before listening:\n${current()}`);
      }
      append(decoder.decode(value));
    }
  }

  static async startServe(
    cwd: string,
    args: string,
    env: Record<string, string> = {}
  ): Promise<ServeHandle> {
    const child = Bun.spawn(['bun', 'run', CLI_PATH, ...TestContexts.parseArgs(args)], {
      cwd,
      env: { ...process.env, NO_COLOR: '1', ...env },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    let output = '';
    const append = (text: string): void => {
      output += text;
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`serve did not start in time:\n${output}`));
      }, STARTUP_TIMEOUT_MS);
    });

    let url: string;
    try {
      url = await Promise.race([
        ServeHelpers.readUntilServing(child.stdout, append, () => {
          return output;
        }),
        timeout,
      ]);
    } catch (error) {
      child.kill();
      const stderr = await new Response(child.stderr).text();
      throw new Error(`${String(error)}\n${stderr}`, { cause: error });
    } finally {
      clearTimeout(timer);
    }

    const request = (path: string, init?: RequestInit): Promise<Response> => {
      return fetch(`${url}${path}`, init);
    };

    return {
      url,
      output: () => {
        return output;
      },
      request,
      async json<T>(path: string, init?: RequestInit) {
        const response = await request(path, init);
        const body: T = await response.json();
        return { status: response.status, body };
      },
      async stop() {
        child.kill();
        await child.exited;
      },
    };
  }

  static jsonInit(method: string, body: unknown, headers: Record<string, string> = {}) {
    return {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    };
  }
}

const CLI_PATH = join(import.meta.dir, '../../src/index.ts');
const STARTUP_TIMEOUT_MS = 15_000;
const SERVING_LINE = /trekker serving (http:\/\/\S+)/;

export interface JsonResponse<T> {
  status: number;
  body: T;
}

export interface ServeHandle {
  url: string;
  output: () => string;
  request: (path: string, init?: RequestInit) => Promise<Response>;
  json: <T>(path: string, init?: RequestInit) => Promise<JsonResponse<T>>;
  stop: () => Promise<void>;
}
