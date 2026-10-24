import type { Server } from 'bun';

export abstract class ServerListener {
  private static isUnavailablePort(error: unknown): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      typeof error.code === 'string' &&
      UNAVAILABLE_PORT_CODES.has(error.code)
    );
  }

  static listenWithFallback(
    requestedPort: number,
    serve: (port: number) => Server<undefined>
  ): Listening {
    try {
      return { server: serve(requestedPort), requestedPort, fellBack: false };
    } catch (error) {
      if (requestedPort === 0 || !ServerListener.isUnavailablePort(error)) {
        throw error;
      }
      return { server: serve(0), requestedPort, fellBack: true };
    }
  }
}

export interface Listening {
  server: Server<undefined>;
  requestedPort: number;
  fellBack: boolean;
}

const UNAVAILABLE_PORT_CODES: ReadonlySet<string> = new Set(['EADDRINUSE', 'EACCES']);
